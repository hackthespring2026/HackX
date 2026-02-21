
import cv2
import mediapipe as mp
import numpy as np

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
cap = cv2.VideoCapture(0)

drawer_box = [(100, 200), (500, 400)]
timestamp = 0

pos_drawer_open = False  

while True:
    success, frame = cap.read()
    if not success:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    result = landmarker.detect_for_video(mp_image, timestamp)
    timestamp += 1

    cv2.rectangle(frame, drawer_box[0], drawer_box[1], (0, 255, 0), 2)
    cv2.putText(frame, "Cash Drawer Area", (110, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

    pos_text = "POS LOG: DRAWER OPEN" if pos_drawer_open else "POS LOG: DRAWER CLOSED"
    pos_color = (0, 255, 255) if pos_drawer_open else (200, 200, 200)
    cv2.putText(frame, pos_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, pos_color, 2)

    if result.hand_landmarks:
        h, w, _ = frame.shape
        for hand_landmarks in result.hand_landmarks:
            index_tip = hand_landmarks[8]
            cx, cy = int(index_tip.x * w), int(index_tip.y * h)
            
            hands_in_drawer = drawer_box[0][0] < cx < drawer_box[1][0] and drawer_box[0][1] < cy < drawer_box[1][1]

            if pos_drawer_open == False:
                if hands_in_drawer:
                    status = "Unauthorized Access"
                    color = (0, 0, 255) 
                else:
                    status = "Idle"
                    color = (0, 255, 0)

            elif pos_drawer_open == True:
                if hands_in_drawer:
                    status = "Normal Transaction"
                    color = (255, 0, 0) 
                else:
                    status = "Pocketing Detected"
                    color = (0, 0, 255) 

            cv2.putText(frame, status, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 3)

    cv2.imshow("Theft Detection System", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('o'): 
        pos_drawer_open = True
        print("Log: POS Command -> Drawer Opened")
    elif key == ord('c'): 
        pos_drawer_open = False
        print("Log: POS Command -> Drawer Closed")

cap.release()
cv2.destroyAllWindows()












# import cv2
# import mediapipe as mp
# import numpy as np
# import csv
# import time

# BaseOptions = mp.tasks.BaseOptions
# HandLandmarker = mp.tasks.vision.HandLandmarker
# HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
# VisionRunningMode = mp.tasks.vision.RunningMode

# options = HandLandmarkerOptions(
#     base_options=BaseOptions(model_asset_path="hand_landmarker.task"),
#     running_mode=VisionRunningMode.VIDEO,
#     num_hands=2
# )

# landmarker = HandLandmarker.create_from_options(options)
# cap = cv2.VideoCapture(0)

# drawer_box = [(100, 200), (500, 400)]
# pocket_zone = [(450, 100), (640, 300)]

# def load_pos_logs():
#     logs = []
#     try:
#         with open("pos_log.csv", "r") as f:
#             reader = csv.DictReader(f)
#             for row in reader:
#                 logs.append((int(row["timestamp"]), row["event"]))
#     except:
#         pass
#     return logs

# def log_alert(message):
#     with open("alerts.log", "a") as f:
#         f.write(f"{int(time.time())} - {message}\n")

# pos_logs = load_pos_logs()
# drawer_state = False
# timestamp = 0

# while True:
#     success, frame = cap.read()
#     if not success:
#         break

#     current_time = int(time.time())

#     for log_time, event in pos_logs:
#         if abs(current_time - log_time) <= 2:
#             if event == "OPEN":
#                 drawer_state = True
#             elif event == "CLOSE":
#                 drawer_state = False

#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

#     result = landmarker.detect_for_video(mp_image, timestamp)
#     timestamp += 1

#     cv2.rectangle(frame, drawer_box[0], drawer_box[1], (0, 255, 0), 2)
#     cv2.rectangle(frame, pocket_zone[0], pocket_zone[1], (255, 0, 255), 2)

#     pos_text = "POS: DRAWER OPEN" if drawer_state else "POS: DRAWER CLOSED"
#     cv2.putText(frame, pos_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

#     status = "Monitoring"
#     color = (0,255,0)

#     if result.hand_landmarks:
#         h, w, _ = frame.shape
#         for hand_landmarks in result.hand_landmarks:
#             index_tip = hand_landmarks[8]
#             cx, cy = int(index_tip.x * w), int(index_tip.y * h)

#             hand_in_drawer = drawer_box[0][0] < cx < drawer_box[1][0] and drawer_box[0][1] < cy < drawer_box[1][1]
#             hand_in_pocket = pocket_zone[0][0] < cx < pocket_zone[1][0] and pocket_zone[0][1] < cy < pocket_zone[1][1]

#             if not drawer_state and hand_in_drawer:
#                 status = "UNAUTHORIZED DRAWER ACCESS"
#                 color = (0,0,255)
#                 log_alert(status)

#             elif drawer_state and hand_in_pocket:
#                 status = "POSSIBLE POCKETING DETECTED"
#                 color = (0,0,255)
#                 log_alert(status)

#             elif drawer_state and hand_in_drawer:
#                 status = "NORMAL TRANSACTION"
#                 color = (255,0,0)

#     cv2.putText(frame, status, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 3)

#     cv2.imshow("AI Theft Detection System", frame)

#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# cap.release()
# cv2.destroyAllWindows()
