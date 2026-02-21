"""
GEC Sentinel — AI Monitor (Tier 2)
====================================
Side-angle YOLO hand trajectory monitor.
- Uses best.pt to detect: cash, counter, hands, pocket
- Tracks 'hands' centroid movement between COUNTER_ZONE and POCKET_ZONE
- Fires POST to Django backend when Hand-to-Pocket trajectory detected
- Maintains a 20-second rolling video buffer; saves clip on alert

Usage:
    python ai_monitor.py              # live webcam
    python ai_monitor.py --video path/to/file.mp4
"""
import cv2
import time
import json
import threading
import argparse
import requests
import numpy as np
from collections import deque
from datetime import datetime
from ultralytics import YOLO

# ─── Config ───────────────────────────────────────────────────────────────
BACKEND_URL     = "http://localhost:8000/api"
MODEL_PATH      = "./backend/sentinel/weights/best.pt"
CONF_THRESHOLD  = 0.05          # low conf — model needs more data
FPS_TARGET      = 10            # process frames at this rate
BUFFER_SECONDS  = 20            # seconds of rolling video to keep
POCKET_ZONE_Y   = 0.55          # normalized y below this = pocket/hip zone
COUNTER_ZONE_Y  = 0.45          # normalized y above this = counter zone
TRAJECTORY_FRAMES = 15          # frames that must show hand moving DOWN to trigger
ALERT_COOLDOWN  = 30            # seconds before a new trajectory alert can fire

# ─── Globals ──────────────────────────────────────────────────────────────
model         = YOLO(MODEL_PATH)
frame_buffer  = deque()          # rolling buffer of (timestamp, frame) tuples
last_alert_ts = 0
wrist_history = deque(maxlen=TRAJECTORY_FRAMES)   # centroid y-positions of 'hands'
lock          = threading.Lock()

def get_centroid(box_xyxy):
    x1, y1, x2, y2 = box_xyxy
    return ((x1 + x2) / 2, (y1 + y2) / 2)

def normalize_centroid(cx, cy, w, h):
    return cx / w, cy / h

def is_trajectory_pocket(history):
    """
    Returns True if the tracked hand centroid moved from COUNTER_ZONE
    into POCKET_ZONE over the last TRAJECTORY_FRAMES frames.
    """
    if len(history) < TRAJECTORY_FRAMES:
        return False
    first_y = history[0]
    last_y  = history[-1]
    # Must start above counter zone AND end below pocket zone
    return first_y < COUNTER_ZONE_Y and last_y > POCKET_ZONE_Y

def save_clip_and_alert(frames, reason):
    """Save the buffered frames as a video clip and POST alert to backend."""
    global last_alert_ts
    if time.time() - last_alert_ts < ALERT_COOLDOWN:
        return
    last_alert_ts = time.time()

    # Save clip
    ts        = datetime.now().strftime("%Y%m%d_%H%M%S")
    clip_path = f"./alert_clip_{ts}.avi"
    if frames:
        h, w = frames[0].shape[:2]
        writer = cv2.VideoWriter(
            clip_path,
            cv2.VideoWriter_fourcc(*'XVID'),
            FPS_TARGET, (w, h)
        )
        for f in frames:
            writer.write(f)
        writer.release()
        print(f"  📹 Clip saved: {clip_path}")

    # POST alert
    try:
        payload = {
            "anomaly_type": "TRAJECTORY",
            "confidence":   0.78,
            "rule_violated": reason,
            "tier_source":  "TRAJECTORY",
            "video_clip":   clip_path,
            "details":      json.dumps({"reason": reason, "clip": clip_path}),
        }
        r = requests.post(f"{BACKEND_URL}/alerts/", json=payload, timeout=5)
        if r.status_code == 201:
            print(f"  🚨 Alert posted → id={r.json().get('id')}")
        else:
            print(f"  ⚠ Alert POST failed: {r.status_code}")
    except Exception as e:
        print(f"  ❌ Backend unreachable: {e}")

def draw_zones(frame):
    """Draw the COUNTER and POCKET zones on the frame."""
    h, w = frame.shape[:2]
    # Counter zone — top cyan band
    cv2.rectangle(frame, (0, 0), (w, int(COUNTER_ZONE_Y * h)),
                  (255, 200, 0), 1)
    cv2.putText(frame, "COUNTER ZONE", (8, 18),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 1)
    # Pocket zone — bottom red band
    cv2.rectangle(frame, (0, int(POCKET_ZONE_Y * h)), (w, h),
                  (0, 0, 255), 1)
    cv2.putText(frame, "POCKET ZONE", (8, int(POCKET_ZONE_Y * h) + 16),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    return frame

def run_monitor(source):
    global frame_buffer

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"❌ Cannot open source: {source}")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    print(f"✅ Monitor started | source={source} | conf={CONF_THRESHOLD}")
    print(f"   Counter zone: y < {COUNTER_ZONE_Y} | Pocket zone: y > {POCKET_ZONE_Y}")
    print("   Press Q to quit.\n")

    buffer_maxlen   = int(FPS_TARGET * BUFFER_SECONDS)
    frame_buffer    = deque(maxlen=buffer_maxlen)
    frame_interval  = 1.0 / FPS_TARGET
    last_frame_time = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        now = time.time()
        if now - last_frame_time < frame_interval:
            continue
        last_frame_time = now

        h, w = frame.shape[:2]
        results  = model(frame, conf=CONF_THRESHOLD, verbose=False)
        annotated = results[0].plot()
        draw_zones(annotated)

        # ── Track 'hands' centroid ─────────────────────────────────────
        hand_detected = False
        for box in results[0].boxes:
            cls_name = model.names[int(box.cls[0])]
            if cls_name == 'hands':
                hand_detected = True
                cx, cy   = get_centroid(box.xyxy[0].tolist())
                _, norm_y = normalize_centroid(cx, cy, w, h)
                wrist_history.append(norm_y)

                # Visualize trajectory dot
                cv2.circle(annotated, (int(cx), int(cy)), 8, (0, 255, 255), -1)
                cv2.putText(annotated, f"hand_y={norm_y:.2f}",
                            (int(cx) + 10, int(cy)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

        if not hand_detected:
            wrist_history.append(None)   # keep timeline consistent

        # Clean Nones for trajectory check
        clean_history = [y for y in wrist_history if y is not None]

        # ── Trajectory check ──────────────────────────────────────────
        alert_text  = ""
        alert_color = (0, 200, 0)
        if is_trajectory_pocket(deque(clean_history, maxlen=TRAJECTORY_FRAMES)):
            alert_text  = "TRAJECTORY ALERT: Hand -> Pocket!"
            alert_color = (0, 0, 255)
            snapshot    = list(frame_buffer)[-buffer_maxlen:]
            clip_frames = [f for _, f in snapshot]
            threading.Thread(
                target=save_clip_and_alert,
                args=(clip_frames, "Hand moved from Counter Zone to Pocket Zone"),
                daemon=True
            ).start()
            wrist_history.clear()   # reset so we don't re-trigger immediately

        # Overlay status
        status_text = alert_text or "Monitoring..."
        cv2.putText(annotated, status_text, (10, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, alert_color, 2)

        # Buffer the annotated frame
        frame_buffer.append((now, annotated.copy()))

        cv2.imshow("Sentinel GEC — AI Monitor (Tier 2)", annotated)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Monitor stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sentinel AI Monitor")
    parser.add_argument("--video", type=str, default=None,
                        help="Path to video file. Omit to use webcam (default).")
    args   = parser.parse_args()
    source = args.video if args.video else 0
    run_monitor(source)
