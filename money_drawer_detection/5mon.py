import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from ultralytics import YOLO
import numpy as np
import time  
import requests # 🔥 Added for cloud communication

# --- Cloud Server Configuration ---
VIDEO_URL = "http://64.227.160.247:8000/upload_frame_3"
ALERT_URL = "http://64.227.160.247:8000/alerts"

# 1. INITIALIZE MODELS
yolo_model = YOLO('best.pt')

base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=1,
    running_mode=vision.RunningMode.VIDEO 
)
detector = vision.HandLandmarker.create_from_options(options)

# Use 0 instead of the filename if you want to switch to live webcam!
cap = cv2.VideoCapture('raw_theft_video.mp4')

# Configuration
STND_H = 580
TRIGGER_LINE = 420
CURRENCY_VALUES = [10, 500, 100, 200, 2000]

# Logic Variables
total_stolen = 0
last_alert_time = 0
ALERT_COOLDOWN = 2.0  

print("🚀 Forensic Terminal Output Active!")
print(f"📡 Broadcasting Video to: {VIDEO_URL}")
print(f"📡 Sending Alerts to: {ALERT_URL}")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: 
        # Automatically loop the video for the presentation!
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    h, w = frame.shape[:2]
    frame = cv2.resize(frame, (int(w * (STND_H/h)), STND_H))
    
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    timestamp_ms = int(cap.get(cv2.CAP_PROP_POS_MSEC))
    
    yolo_results = yolo_model(frame, conf=0.4, verbose=False)
    hand_result = detector.detect_for_video(mp_image, timestamp_ms)

    drawer_box = None
    if yolo_results[0].boxes:
        boxes = sorted(yolo_results[0].boxes, key=lambda b: (b.xyxy[0][2]-b.xyxy[0][0]) * (b.xyxy[0][3]-b.xyxy[0][1]), reverse=True)
        drawer_box = boxes[0]

    if drawer_box:
        dx1, dy1, dx2, dy2 = map(int, drawer_box.xyxy[0])
        drawer_w = dx2 - dx1
        drawer_open = dy2 > TRIGGER_LINE
        
        drawer_status = "THEFT RISK: OPEN" if drawer_open else "SECURE: CLOSED"
        drawer_color = (0, 0, 255) if drawer_open else (0, 255, 0) # Changed open to red for urgency

        cv2.rectangle(frame, (dx1, dy1), (dx2, dy2), drawer_color, 3)
        cv2.putText(frame, drawer_status, (dx1, dy1 - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, drawer_color, 2)

        if drawer_open and hand_result.hand_landmarks:
            landmarks = hand_result.hand_landmarks[0]
            itx = int(landmarks[8].x * frame.shape[1])
            ity = int(landmarks[8].y * frame.shape[0])

            if dx1 < itx < dx2:
                rel_x = (itx - dx1) - (drawer_w * 0.05)
                slot_idx = max(0, min(int(rel_x // (drawer_w / 5)), 4))
                val = CURRENCY_VALUES[slot_idx]

                # --- TERMINAL OUTPUT AND DASHBOARD ALERT ---
                current_time = time.time()
                if current_time - last_alert_time > ALERT_COOLDOWN:
                    total_stolen += val
                    
                    msg = f"CASH DRAWER THEFT! Stolen: {val} INR | Total Loss: {total_stolen} INR"
                    print(f"🚨 {msg}")
                    
                    # 🔥 Blast the alert to the React Dashboard
                    try:
                        requests.post(ALERT_URL, json={"alert_type": "theft", "message": msg}, timeout=1)
                    except:
                        pass # Ignore network drops to keep video running smoothly
                        
                    last_alert_time = current_time

                # Hover Visuals
                cv2.rectangle(frame, (itx - 65, ity - 65), (itx + 65, ity - 25), (0, 0, 0), -1)
                cv2.putText(frame, f"VAL: {val}", (itx - 55, ity - 40), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.circle(frame, (itx, ity), 8, (255, 255, 255), -1) 

    cv2.line(frame, (0, TRIGGER_LINE), (frame.shape[1], TRIGGER_LINE), (255, 0, 0), 2)
    
    # 🔥 Compress and stream the video frame to CAM 3
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
    try:
        requests.post(VIDEO_URL, data=buffer.tobytes(), timeout=0.5)
    except Exception as e:
        pass 

    cv2.imshow("Forensic Task Tracker", frame)
    if cv2.waitKey(20) & 0xFF == ord('q'): break

detector.close()
cap.release()
cv2.destroyAllWindows()