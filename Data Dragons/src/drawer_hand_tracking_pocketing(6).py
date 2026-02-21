import cv2
import numpy as np
from collections import deque
from ultralytics import YOLO
import mediapipe as mp
import math
import time

# ----------------------------
# Load Models
# ----------------------------
yolo = YOLO("yolov8n.pt")  # person + laptop

mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands

pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.6, min_tracking_confidence=0.6)

# ----------------------------
# Drawer Fixed ROI (tune this)
# ----------------------------
DRAWER_BOX = (50, 300, 250, 480)  # x1,y1,x2,y2
pocketing_detection=[]

# ----------------------------
# Hand trajectory buffer
# ----------------------------
hand_path = deque(maxlen=20)
state = "IDLE"
drawer_open = False
drawer_last_change = time.time()

# ----------------------------
# Utils
# ----------------------------
def inside(box, point):
    x1, y1, x2, y2 = box
    x, y = point
    return x1 < x < x2 and y1 < y < y2

def distance(p1, p2):
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

# ----------------------------
# Camera
# ----------------------------
cap = cv2.VideoCapture(0)

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
    # YOLO Detection
    # ----------------------------
    results = yolo(frame, conf=0.4, verbose=False)[0]
    for box in results.boxes:
        cls = int(box.cls[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        label = yolo.names[cls]

        if label == "person":
            person_detected = True
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(frame, "Person", (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

        if label == "laptop":
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            drawer_open = inside(DRAWER_BOX, (cx, cy))
            color = (0,255,0) if drawer_open else (0,0,255)
            cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
            cv2.putText(frame, "Drawer Object", (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # ----------------------------
    # Pose Detection (Pocket Zone)
    # ----------------------------
    pose_result = pose.process(rgb)
    if pose_result.pose_landmarks:
        lh = pose_result.pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
        rh = pose_result.pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]

        hip_x = int((lh.x + rh.x) * w / 2)
        hip_y = int((lh.y + rh.y) * h / 2)

        pocket_zone = (hip_x - 40, hip_y - 20, hip_x + 40, hip_y + 80)
        cv2.rectangle(frame, (pocket_zone[0], pocket_zone[1]),
                      (pocket_zone[2], pocket_zone[3]), (255,255,0), 2)
        cv2.putText(frame, "Pocket Zone", (pocket_zone[0], pocket_zone[1]-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,0), 2)

    # ----------------------------
    # Hand Detection
    # ----------------------------
    hand_results = hands.process(rgb)
    if hand_results.multi_hand_landmarks:
        for handLms in hand_results.multi_hand_landmarks:
            idx = handLms.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
            hx, hy = int(idx.x * w), int(idx.y * h)
            hand_point = (hx, hy)
            hand_path.append(hand_point)

            cv2.circle(frame, (hx, hy), 8, (0,0,255), -1)

    # ----------------------------
    # Draw Drawer ROI
    # ----------------------------
    cv2.rectangle(frame, (DRAWER_BOX[0], DRAWER_BOX[1]),
                  (DRAWER_BOX[2], DRAWER_BOX[3]), (255,0,0), 2)
    cv2.putText(frame, "Drawer ROI", (DRAWER_BOX[0], DRAWER_BOX[1]-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,0,0), 2)

    # ----------------------------
    # Draw Hand Path
    # ----------------------------
    for i in range(1, len(hand_path)):
        cv2.line(frame, hand_path[i-1], hand_path[i], (0,255,255), 2)

    # ----------------------------
    # Suspicious Logic
    # ----------------------------
    alert = False
    if drawer_open and person_detected and hand_point and pocket_zone:

        if inside(DRAWER_BOX, hand_point):
            state = "HAND_IN_DRAWER"

        elif state == "HAND_IN_DRAWER" and len(hand_path) > 10 and distance(hand_path[0], hand_path[-1]) > 80:
            state = "HAND_MOVING"

        elif state == "HAND_MOVING" and inside(pocket_zone, hand_point):
            alert = True
            state = "ALERT"

    # ----------------------------
    # UI
    # ----------------------------
    status = f"Drawer: {'OPEN' if drawer_open else 'CLOSE'} | State: {state}"
    cv2.putText(frame, status, (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,255), 2)

    if alert:
        cv2.putText(frame, "🚨 SUSPICIOUS ACTIVITY!", (50, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 3)
        pocketing_detection.append("🚨 SUSPICIOUS ACTIVITY! of drawer to pocket found")

    cv2.imshow("Drawer-Hand-Pocket Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

print(pocketing_detection)
cap.release()
cv2.destroyAllWindows()