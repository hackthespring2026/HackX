import cv2
import numpy as np
import math
import time
from collections import deque
from ultralytics import YOLO
import mediapipe as mp
import requests

#ALERT_API = "http://127.0.0.1:5000/alert"

# ----------------------------
# Models
# ----------------------------
yolo = YOLO("yolov8n.pt")  # person + laptop

mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
    
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.6, min_tracking_confidence=0.6)

# ----------------------------
# Fixed ROIs (TUNE THESE)
# ----------------------------
# DRAWER_BOX = (40, 300, 260, 470)   # Blue box
# DESK_BOX = (220, 250, 480, 390)  # Pink box

DRAWER_BOX = (40, 300, 260, 470)

desk_height = 100
gap = 100  # increase this to move it more upward

DESK_BOX = (
    40,
    300 - desk_height - gap,  # y1
    260,
    300 - gap                 # y2
)

# ----------------------------
# State
# ----------------------------
hand_path = deque(maxlen=25)
drawer_state = "IDLE"
desk_state = "IDLE"
drawer_open = False
alert = False
normal_state = "IDLE"
normal_done = False

# ----------------------------
# Utils
# ----------------------------
def inside(box, point):
    x1, y1, x2, y2 = box
    x, y = point
    return x1 < x < x2 and y1 < y < y2

def dist(p1, p2):
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

# ----------------------------
# Camera
# ----------------------------
#cap = cv2.VideoCapture(0)
#cap = cv2.VideoCapture("http://192.168.159.36:4747/video")
cap = cv2.VideoCapture(2)
#cap = cv2.VideoCapture("http://100.83.245.129:8080/video")

pocketing_detection=[]

while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    person_detected = False
    hand_point = None
    pocket_zone = None

    # ----------------------------
    # YOLO: Person + Laptop (Drawer Placeholder)
    # ----------------------------
    results = yolo(frame, conf=0.4, verbose=False)[0]
    for box in results.boxes:
        cls = int(box.cls[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label = yolo.names[cls]

        if label == "person":
            person_detected = True
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, "Person", (x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

        if label == "laptop":
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            drawer_open = inside(DRAWER_BOX, (cx, cy))
            color = (0,255,0) if drawer_open else (0,0,255)
            cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
            cv2.putText(frame, "Drawer Obj", (x1,y1-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # ----------------------------
    # Pose: Shoulder → Fingers (Arm) + Pocket Zone
    # ----------------------------
    pose_res = pose.process(rgb)
    if pose_res.pose_landmarks:
        lm = pose_res.pose_landmarks.landmark

        shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        hip = lm[mp_pose.PoseLandmark.RIGHT_HIP]

        sx, sy = int(shoulder.x * w), int(shoulder.y * h)
        hx, hy = int(hip.x * w), int(hip.y * h)

        cv2.line(frame, (sx, sy), (hx, hy), (255, 255, 0), 2)
        cv2.circle(frame, (sx, sy), 6, (255, 255, 0), -1)

        # Pocket ROI (around hip)
        pocket_zone = (hx - 40, hy - 20, hx + 40, hy + 80)
        cv2.rectangle(frame, (pocket_zone[0], pocket_zone[1]),
                      (pocket_zone[2], pocket_zone[3]), (255,255,0), 2)
        cv2.putText(frame, "Pocket", (pocket_zone[0], pocket_zone[1]-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,0), 2)

    # ----------------------------
    # Hands
    # ----------------------------
    hand_res = hands.process(rgb)
    if hand_res.multi_hand_landmarks:
        for hnd in hand_res.multi_hand_landmarks:
            tip = hnd.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            hx, hy = int(tip.x * w), int(tip.y * h)
            hand_point = (hx, hy)
            hand_path.append(hand_point)
            cv2.circle(frame, hand_point, 7, (0,0,255), -1)

    # ----------------------------
    # Draw ROIs
    # ----------------------------
    cv2.rectangle(frame, DRAWER_BOX[:2], DRAWER_BOX[2:], (255,0,0), 2)
    cv2.putText(frame, "Drawer ROI", (DRAWER_BOX[0], DRAWER_BOX[1]-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,0,0), 2)

    cv2.rectangle(frame, DESK_BOX[:2], DESK_BOX[2:], (255,0,255), 2)
    cv2.putText(frame, "Desk ROI", (DESK_BOX[0], DESK_BOX[1]-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,0,255), 2)

    # ----------------------------
    # Hand Path
    # ----------------------------
    for i in range(1, len(hand_path)):
        cv2.line(frame, hand_path[i-1], hand_path[i], (0,255,255), 2)

    # ----------------------------
    # Suspicious Logic
    # ----------------------------
    alert = False

    if person_detected and hand_point and pocket_zone:

        # Drawer → Pocket
        if drawer_open and inside(DRAWER_BOX, hand_point):
            drawer_state = "HAND_IN_DRAWER"

        elif drawer_state == "HAND_IN_DRAWER":
            drawer_state = "HAND_MOVING_FROM_DRAWER"

        elif drawer_state == "HAND_MOVING_FROM_DRAWER" and inside(pocket_zone, hand_point):
            alert = True
            drawer_state = "ALERT_DRAWER_TO_POCKET"
            pocketing_detection.append("🚨 SUSPICIOUS ACTIVITY! of drawer to pocket found")

        # Desk → Pocket
        if inside(DESK_BOX, hand_point):
            desk_state = "HAND_ON_DESK"

        elif desk_state == "HAND_ON_DESK":
            desk_state = "HAND_MOVING_FROM_DESK"

        elif desk_state == "HAND_MOVING_FROM_DESK" and inside(pocket_zone, hand_point):
            alert = True
            desk_state = "ALERT_DESK_TO_POCKET"
            pocketing_detection.append("🚨 SUSPICIOUS ACTIVITY! of desk to pocket found")

        # Desk → Drawer (Normal Flow)
        if inside(DESK_BOX, hand_point):
            normal_state = "HAND_ON_DESK"

        elif desk_state == "HAND_ON_DESK":
            desk_state = "HAND_MOVING_FROM_DESK"

        elif desk_state == "HAND_MOVING_FROM_DESK" and inside(DRAWER_BOX, hand_point):
            normal_done = True
            normal_state = "DONE"

    # ----------------------------
    # UI
    # ----------------------------
    status = f"Drawer: {'OPEN' if drawer_open else 'CLOSE'} | DrawerState: {drawer_state} | DeskState: {desk_state}"
    cv2.putText(frame, status, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

    if alert:
        cv2.putText(frame, "🚨 SUSPICIOUS: OBJECT TO POCKET", (40, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 3)
    
    elif normal_done:
        cv2.putText(frame, "DONE: Desk to Drawer", (40, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 3)

    cv2.imshow("Retail Theft Detection MVP", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

print(pocketing_detection)
cap.release()
cv2.destroyAllWindows()