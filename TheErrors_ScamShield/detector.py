import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import time
import os

def process_video(input_path: str, output_path: str):
    print(f"Starting processing for {input_path}")
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

    cap = cv2.VideoCapture(input_path)

    if not cap.isOpened():
        raise Exception(f"Cannot open video {input_path}")

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps if fps > 0 else 20, (frame_width, frame_height))

    # Dynamic ROI calculation based on frame dimensions rather than hardcoded pixels
    drawer_x1 = int(frame_width * 0.35)
    drawer_y1 = int(frame_height * 0.55)
    drawer_x2 = int(frame_width * 0.65)
    drawer_y2 = int(frame_height * 0.95)
    drawer_box = [(drawer_x1, drawer_y1), (drawer_x2, drawer_y2)]

    prev_gray = None
    pos_drawer_open = False
    THEFT_TIME_THRESHOLD = 5.0
    person_history = {}

    while True:
        success, frame = cap.read()
        if not success:
            break

        timestamp = int(cap.get(cv2.CAP_PROP_POS_MSEC))
        if timestamp == 0: 
            timestamp = 1

        status = "Monitoring"
        color = (0, 255, 0)

        # Utilize YOLO tracked object IDs to handle multi-person theft reliably
        results = yolo_model.track(frame, persist=True, verbose=False)
        persons = {}

        for r in results:
            for box in r.boxes:
                if int(box.cls[0]) == 0 and box.id is not None:
                    pid = int(box.id[0])
                    px1, py1, px2, py2 = map(int, box.xyxy[0])
                    
                    # Pocket ROI scaled to each person's bounding box to generalize for any person height/distance
                    pocket_top = int(py1 + (py2 - py1) * 0.45)
                    pocket_box = [(px1, pocket_top), (px2, py2)]
                    
                    persons[pid] = {'bbox': (px1, py1, px2, py2), 'pocket': pocket_box}
                    
                    if pid not in person_history:
                        person_history[pid] = {'drawer_touch_time': 0}

                    cv2.rectangle(frame, (px1, py1), (px2, py2), (255, 255, 0), 2)
                    cv2.rectangle(frame, pocket_box[0], pocket_box[1], (0, 0, 255), 2)
                    cv2.putText(frame, f"ID: {pid}", (px1, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

        cv2.rectangle(frame, drawer_box[0], drawer_box[1], (0, 255, 0), 2)

        x1, y1 = drawer_box[0]
        x2, y2 = drawer_box[1]
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

                if motion_score > 50000:
                    pos_drawer_open = True
                
                prev_gray = gray

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = landmarker.detect_for_video(mp_image, timestamp)

        if result.hand_landmarks:
            h, w, _ = frame.shape
            
            for hand_landmarks in result.hand_landmarks:
                wrist_x = int(hand_landmarks[0].x * w)
                wrist_y = int(hand_landmarks[0].y * h)
                
                owner_id = None
                min_dist = float('inf')
                for pid, pdata in persons.items():
                    px1, py1, px2, py2 = pdata['bbox']
                    pcx, pcy = (px1 + px2) // 2, (py1 + py2) // 2
                    dist = (wrist_x - pcx)**2 + (wrist_y - pcy)**2
                    if dist < min_dist:
                        min_dist = dist
                        owner_id = pid

                in_drawer = False
                in_pocket_for_owner = False

                for lm in hand_landmarks:
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    cv2.circle(frame, (cx, cy), 3, (255, 0, 255), -1)
                    
                    if x1 < cx < x2 and y1 < cy < y2:
                        in_drawer = True
                        
                    if owner_id is not None:
                        px1, py1 = persons[owner_id]['pocket'][0]
                        px2, py2 = persons[owner_id]['pocket'][1]
                        if px1 < cx < px2 and py1 < cy < py2:
                            in_pocket_for_owner = True

                if in_drawer:
                    if not pos_drawer_open:
                        status = "UNAUTHORIZED ACCESS"
                        color = (0, 165, 255)
                    else:
                        if owner_id is not None:
                            person_history[owner_id]['drawer_touch_time'] = time.time()
                        status = "CASH ACCESSED"
                        color = (255, 255, 0)

                if owner_id is not None and in_pocket_for_owner:
                    if person_history[owner_id]['drawer_touch_time'] > 0:
                        if time.time() - person_history[owner_id]['drawer_touch_time'] < THEFT_TIME_THRESHOLD:
                            status = f"THEFT CONFIRMED! (ID:{owner_id})"
                            color = (0, 0, 255)
                            cv2.rectangle(frame, (0, 0), (w, h), (0, 0, 255), 10)

        pos_text = "DRAWER STATE: " + ("OPEN" if pos_drawer_open else "CLOSED")
        cv2.putText(frame, pos_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255) if pos_drawer_open else (200, 200, 200), 2)
        cv2.rectangle(frame, (10, 60), (600, 110), (0, 0, 0), -1)
        cv2.putText(frame, status, (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)

        out.write(frame)

    cap.release()
    out.release()
    landmarker.close()
    print(f"Finished processing. Output saved to: {output_path}")

if __name__ == "__main__":
    # Test block
    process_video("test_video_3.mp4", "outputs/test_output.mp4")
