import cv2
import requests
import time
from ultralytics import YOLO
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

print("Loading AI Models...")

# --- 1. YOLOv8 Setup ---
print("Loading Fast YOLOv8 AI Model...")
model = YOLO("yolov8n.pt")

# --- 2. MediaPipe Pose Setup ---
print("Loading MediaPipe Pose Landmarker...")
base_options = python.BaseOptions(model_asset_path='pose_landmarker.task') 
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO
)
detector = vision.PoseLandmarker.create_from_options(options)

# --- Configuration & Endpoints ---
SERVER_URL = "http://64.227.160.247:8000/upload_frame"
ALERT_URL = "http://64.227.160.247:8000/alerts"

# --- Hardware Setup ---
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# --- State Variables ---
# YOLO Variables
frame_counter = 0
last_boxes = []

# Pose Variables
cross_count = 0
last_side = None
pocket_touch_frames = 0
scan_frames = 0
last_timestamp = 0

# Cooldown Logic (Unified for both models)
last_alert_time = {
    "phone": 0, "queue": 0, "unattended": 0,
    "looking": 0, "pacing": 0, "pocket": 0
}
COOLDOWN_SECONDS = 10 

def send_alert(alert_type, message):
    """Sends an alert to the dashboard, respecting the 10-second cooldown."""
    current_time = time.time()
    if current_time - last_alert_time[alert_type] > COOLDOWN_SECONDS:
        try:
            requests.post(ALERT_URL, json={"alert_type": alert_type, "message": message}, timeout=1)
            last_alert_time[alert_type] = current_time
            print(f"🚨 ALERT SENT TO DASHBOARD: {message}")
        except Exception:
            pass # Silently drop network errors to prevent freezing

print(f"🚀 Petpooja Edge AI Node Active!")
print(f"📡 Broadcasting Video to: {SERVER_URL}")
print(f"📡 Sending Alerts to: {ALERT_URL}")
print("Press 'q' to stop, 'r' to reset pacing count.")

while True:
    ret, frame = cap.read()
    if not ret: 
        print("Camera disconnected!")
        break
    
    # Mirror the frame
    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    frame_counter += 1
    active_alerts = [] # Store text/colors for UI rendering

    # ==========================================
    # 🧠 MODEL 1: MEDIAPIPE POSE (Runs every frame)
    # ==========================================
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    # MediaPipe requires strictly increasing timestamps
    timestamp = int(time.time() * 1000)
    if timestamp <= last_timestamp:
        timestamp = last_timestamp + 1
    last_timestamp = timestamp
    
    pose_result = detector.detect_for_video(mp_image, timestamp)

    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks[0]
        
        # Logic 1: Stable Scanning
        shoulder_width = abs(lm[12].x - lm[11].x) + 0.001
        head_center = (lm[12].x + lm[11].x) / 2
        look_deviation = (lm[0].x - head_center) / shoulder_width
        
        if abs(look_deviation) > 0.2:
            scan_frames += 1
            if scan_frames > 10:
                msg = "SUSPICIOUS: LOOKING AROUND"
                active_alerts.append((msg, (0, 0, 255)))
                send_alert("looking", msg)
        else:
            scan_frames = 0

        # Logic 2: Pacing
        shoulder_mid_x = (lm[11].x + lm[12].x) / 2
        current_side = "L" if shoulder_mid_x < 0.5 else "R"
        if last_side and current_side != last_side:
            cross_count += 1
        last_side = current_side
        
        if cross_count > 5:
            msg = f"SUSPICIOUS: PACING ({cross_count})"
            active_alerts.append((msg, (0, 165, 255)))
            send_alert("pacing", msg)

        # Logic 3: Pocket Touching
        hand_to_hip_dist = ((lm[16].x - lm[24].x)**2 + (lm[16].y - lm[24].y)**2)**0.5
        if hand_to_hip_dist < 0.12: 
            pocket_touch_frames += 1
            if pocket_touch_frames > 15:
                msg = "SUSPICIOUS: POCKET TOUCHING"
                active_alerts.append((msg, (255, 0, 255)))
                send_alert("pocket", msg)
        else:
            pocket_touch_frames = 0

        # Draw Pose Landmarks
        for idx in [0, 7, 8, 11, 12, 16, 24]:
            cx, cy = int(lm[idx].x * w), int(lm[idx].y * h)
            cv2.circle(frame, (cx, cy), 5, (255, 255, 255), -1)

    # ==========================================
    # 🧠 MODEL 2: YOLOv8 (Runs every 3rd frame)
    # ==========================================
    if frame_counter % 3 == 0:
        results = model.predict(source=frame, conf=0.35, imgsz=320, verbose=False)
        last_boxes = results[0].boxes

    persons_count = 0
    phones_count = 0

    if last_boxes is not None:
        for box in last_boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls_name = model.names[int(box.cls[0])]
            conf = float(box.conf[0])

            if cls_name == "person":
                persons_count += 1
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"Person {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            elif cls_name == "cell phone":
                phones_count += 1
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, "PHONE DETECTED", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                
            elif cls_name in ["laptop", "cup", "bottle", "keyboard", "mouse"]:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 140, 0), 2)
                cv2.putText(frame, cls_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 140, 0), 1)

    # YOLO Alert Logic
    if phones_count > 0:
        msg = "ANOMALY: STAFF USING PHONE!"
        active_alerts.append((msg, (0, 0, 255)))
        send_alert("phone", msg)
    elif persons_count > 3:
        msg = "WARNING: LONG QUEUE"
        active_alerts.append((msg, (0, 165, 255)))
        send_alert("queue", msg)
    elif persons_count == 0:
        msg = "ALERT: POS UNATTENDED"
        active_alerts.append((msg, (0, 255, 255)))
        send_alert("unattended", msg)
    elif not active_alerts: # Only say secure if NO alerts (YOLO or Pose) are active
        active_alerts.append(("POS Status: SECURE", (0, 255, 0)))

    # ==========================================
    # 🖥️ UI DISPLAY & CLOUD STREAMING
    # ==========================================
    # Draw unified black overlay panel for alerts
    cv2.rectangle(frame, (0, 0), (w, 10 + (len(active_alerts) * 35)), (0, 0, 0), -1)
    
    for i, (text, color) in enumerate(active_alerts):
        cv2.putText(frame, text, (15, 35 + (i * 35)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    # Cloud Streaming Logic
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
    try:
        requests.post(SERVER_URL, data=buffer.tobytes(), timeout=0.5)
    except:
        pass 

    # Local Display
    cv2.imshow("Hack The Spring - Petpooja AI Node", frame)
    
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'): break
    elif key == ord('r'): cross_count = 0

# Cleanup
detector.close()
cap.release()
cv2.destroyAllWindows()