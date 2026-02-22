import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import time

yolo_model = YOLO("yolov8n.pt")

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="hand_landmarker.task"),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2
)
landmarker = HandLandmarker.create_from_options(options)

video_path = "test_video_1.mp4"
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    exit()

frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = int(cap.get(cv2.CAP_PROP_FPS))

out = cv2.VideoWriter(
    "output.mp4",
    cv2.VideoWriter_fourcc(*'mp4v'),
    fps if fps > 0 else 20,
    (frame_width, frame_height)
)

drawer_x1 = int(frame_width * 0.38)
drawer_y1 = int(frame_height * 0.60)
drawer_x2 = int(frame_width * 0.65)
drawer_y2 = int(frame_height * 0.95)
fixed_drawer_box = [(drawer_x1, drawer_y1), (drawer_x2, drawer_y2)]

prev_gray = None
pos_drawer_open = False
drawer_touch_time = None
THEFT_TIME_THRESHOLD = 3.0

while True:
    success, frame = cap.read()
    if not success:
        break

    timestamp = int(cap.get(cv2.CAP_PROP_POS_MSEC))
    if timestamp == 0:
        timestamp = 1

    status = "Monitoring"
    color = (0, 255, 0)
    pocket_box = None

    results = yolo_model(frame, verbose=False)
    
    for r in results:
        for box in r.boxes:
            if int(box.cls[0]) == 0:
                px1, py1, px2, py2 = map(int, box.xyxy[0])
                
                cv2.rectangle(frame, (px1, py1), (px2, py2), (255, 255, 0), 2)
                
                pocket_top = int(py1 + (py2 - py1) * 0.6)
                pocket_box = [(px1, pocket_top), (px2, py2)]
                cv2.rectangle(frame, pocket_box[0], pocket_box[1], (0, 0, 255), 2)

    cv2.rectangle(frame, fixed_drawer_box[0], fixed_drawer_box[1], (0, 255, 0), 2)

    x1, y1 = fixed_drawer_box[0]
    x2, y2 = fixed_drawer_box[1]
    drawer_roi = frame[y1:y2, x1:x2]
    
    if drawer_roi.size > 0:
        gray = cv2.cvtColor(drawer_roi, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if prev_gray is None:
            prev_gray = gray
        else:
            frame_diff = cv2.absdiff(prev_gray, gray)
            thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)[1]
            motion_score = np.sum(thresh)

            if motion_score > 80000:
                pos_drawer_open = True
            
            prev_gray = gray

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    result = landmarker.detect_for_video(mp_image, timestamp)

    if result.hand_landmarks:
        h, w, _ = frame.shape
        
        for hand_landmarks in result.hand_landmarks:
            index_tip = hand_landmarks[8]
            cx, cy = int(index_tip.x * w), int(index_tip.y * h)

            cv2.circle(frame, (cx, cy), 8, (255, 0, 255), -1)

            in_drawer = (x1 < cx < x2 and y1 < cy < y2)
            in_pocket = False
            
            if pocket_box:
                in_pocket = (pocket_box[0][0] < cx < pocket_box[1][0] and pocket_box[0][1] < cy < pocket_box[1][1])

            if not pos_drawer_open and in_drawer:
                status = "UNAUTHORIZED ACCESS"
                color = (0, 165, 255)

            if pos_drawer_open and in_drawer:
                drawer_touch_time = time.time()
                status = "CASH ACCESSED"
                color = (255, 255, 0)

            if drawer_touch_time and in_pocket:
                elapsed = time.time() - drawer_touch_time
                if elapsed < THEFT_TIME_THRESHOLD:
                    status = "THEFT CONFIRMED!"
                    color = (0, 0, 255)
                    cv2.rectangle(frame, (0, 0), (w, h), (0, 0, 255), 10)

    pos_text = "DRAWER STATE: " + ("OPEN" if pos_drawer_open else "CLOSED")
    cv2.putText(frame, pos_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255) if pos_drawer_open else (200, 200, 200), 2)
    
    cv2.rectangle(frame, (10, 60), (450, 110), (0, 0, 0), -1)
    cv2.putText(frame, status, (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)

    cv2.imshow("AI Theft Detection - Production Setup", frame)
    out.write(frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()