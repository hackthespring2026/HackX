import cv2
import numpy as np
import os
import time
from ultralytics import YOLO

# =========================
# CONFIGURATION
# =========================

VIDEO_SOURCE = "file"  # "file" / "webcam"
VIDEO_PATH = "data/videos/Retail_Transaction_Video_Generation.mp4"
VIDEO_PATH = "data/videos/video_4.mp4"
MODEL_PATH = "models/best2.pt"

STATE_THRESHOLD = 15
BASELINE_SECONDS = 2
SMOOTHING_FRAMES = 5

EVIDENCE_DIR = "evidence"
THEFT_COOLDOWN = 3  # seconds between saves

# =========================
# SETUP
# =========================

os.makedirs(EVIDENCE_DIR, exist_ok=True)

model = YOLO(MODEL_PATH)

cap = cv2.VideoCapture(VIDEO_PATH if VIDEO_SOURCE == "file" else 0)

if not cap.isOpened():
    print("❌ Cannot open video source")
    exit()

fps = cap.get(cv2.CAP_PROP_FPS)
if fps == 0:
    fps = 30

total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"✅ FPS: {fps}")
print(f"✅ Total Frames: {total_frames}")

# =========================
# AUTO CALIBRATION SETTINGS
# =========================

BASELINE_FRAMES = int(fps * BASELINE_SECONDS)

frame_count = 0
state_score = 0
closed_drawer_gray = None
best_motion_score = float("inf")
prev_gray = None
drawer_states = []

last_theft_time = 0
theft_detected_flag = False

# =========================
# PROCESSING LOOP
# =========================

while True:
    ret, frame = cap.read()

    if not ret:
        print("✅ End of stream reached")
        break

    frame_count += 1
    drawer_detected = False
    drawer_open = False
    theft_detected = False

    results = model(frame, verbose=False)

    for r in results:
        for box in r.boxes:

            cls = int(box.cls[0])
            label = model.names[cls]

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # =========================
            # DRAWER DETECTION
            # =========================

            if label == "drawer":

                drawer_detected = True

                drawer_roi = frame[y1:y2, x1:x2]

                if drawer_roi.size == 0:
                    continue

                gray_drawer = cv2.cvtColor(drawer_roi, cv2.COLOR_BGR2GRAY)

                if frame_count <= BASELINE_FRAMES:

                    if prev_gray is not None:

                        gray_resized = cv2.resize(
                            gray_drawer,
                            (prev_gray.shape[1], prev_gray.shape[0])
                        )

                        motion = cv2.absdiff(prev_gray, gray_resized).mean()

                        if motion < best_motion_score:
                            best_motion_score = motion
                            closed_drawer_gray = gray_resized.copy()

                    prev_gray = gray_drawer

                    cv2.putText(frame,
                                "Auto-Calibrating Baseline...",
                                (20, 180),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.7,
                                (0, 255, 255),
                                2)

                    continue

                if closed_drawer_gray is not None:

                    gray_resized = cv2.resize(
                        gray_drawer,
                        (closed_drawer_gray.shape[1],
                         closed_drawer_gray.shape[0])
                    )

                    diff = cv2.absdiff(closed_drawer_gray, gray_resized)
                    state_score = diff.mean()

                    raw_state = state_score > STATE_THRESHOLD

                    drawer_states.append(raw_state)

                    if len(drawer_states) > SMOOTHING_FRAMES:
                        drawer_states.pop(0)

                    drawer_open = sum(drawer_states) > (SMOOTHING_FRAMES // 2)

                color = (0, 255, 0) if drawer_open else (0, 0, 255)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                cv2.putText(frame,
                            f"Drawer {'OPEN' if drawer_open else 'CLOSED'}",
                            (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            color,
                            2)

            # =========================
            # THEFT DETECTION
            # =========================

            if label == "theft":

                theft_detected = True

                cv2.rectangle(frame, (x1, y1), (x2, y2),
                              (0, 0, 255), 2)

                cv2.putText(frame,
                            "THEFT DETECTED!",
                            (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.7,
                            (0, 0, 255),
                            2)

    # =========================
    # THEFT ALERT + EVIDENCE SAVE
    # =========================

    current_time = time.time()

    if theft_detected:

        if not theft_detected_flag:
            print(f"🚨 Theft detected at frame {frame_count}")

        theft_detected_flag = True

        if current_time - last_theft_time > THEFT_COOLDOWN:

            filename = f"{EVIDENCE_DIR}/theft_frame_{frame_count}.jpg"
            cv2.imwrite(filename, frame)
            print(f"📸 Evidence saved: {filename}")

            last_theft_time = current_time

    else:
        theft_detected_flag = False

    # =========================
    # DEBUG OVERLAYS
    # =========================

    cv2.putText(frame, f"Frame: {frame_count}",
                (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2)

    cv2.putText(frame, f"Drawer Detected: {drawer_detected}",
                (20, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2)

    cv2.putText(frame, f"State Score: {state_score:.2f}",
                (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 0),
                2)

    status_text = "THEFT" if theft_detected else "NO THEFT"
    status_color = (0, 0, 255) if theft_detected else (0, 255, 0)

    cv2.putText(frame, f"Status: {status_text}",
                (20, 150),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                status_color,
                3)

    # =========================
    # DISPLAY
    # =========================

    cv2.imshow("Theft Detection System", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("🛑 User exit")
        break

# =========================
# CLEANUP
# =========================

cap.release()
cv2.destroyAllWindows()