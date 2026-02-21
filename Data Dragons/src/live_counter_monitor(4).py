import cv2
from ultralytics import YOLO
import mediapipe as mp
import time

# -------- Models --------
model = YOLO("yolov8n.pt")

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

cap = cv2.VideoCapture(0)

# -------- Config --------
DRAWER_PLACEHOLDER = "laptop"  # can change to keyboard
DRAWER_ZONE = (150, 200, 550, 450) # Calibrate this for your camera
OVERLAP_THRESHOLD = 0.6

drawer_state = "UNKNOWN"
commands=[]
activities=[]

def overlap_ratio(boxA, boxB):
    ax1, ay1, ax2, ay2 = boxA
    bx1, by1, bx2, by2 = boxB

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0

    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    boxA_area = (ax2 - ax1) * (ay2 - ay1)
    return inter_area / boxA_area


while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Draw drawer zone
    zx1, zy1, zx2, zy2 = DRAWER_ZONE
    cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), (255, 255, 0), 2)
    cv2.putText(frame, "DRAWER ZONE (OPEN Position)", (zx1, zy1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    results = model(frame)
    drawer_detected = False
    person_detected = False

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_name = model.names[cls_id]

            # Person
            if class_name == "person":
                person_detected = True
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, "Person", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # Drawer placeholder
            if class_name == DRAWER_PLACEHOLDER:
                drawer_detected = True
                drawer_box = (x1, y1, x2, y2)

                overlap = overlap_ratio(drawer_box, DRAWER_ZONE)

                if overlap > OVERLAP_THRESHOLD:
                    drawer_state = "OPEN"
                    color = (0, 0, 255)
                else:
                    drawer_state = "CLOSED"
                    color = (255, 0, 0)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"Drawer {drawer_state}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    if not drawer_detected:
        drawer_state = "CLOSED"

    # -------- Hands --------
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    # -------- Status Panel --------
    status = f"Person: {person_detected} | Drawer: {drawer_state}"
    cv2.putText(frame, status, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                
    if person_detected==True and drawer_state=="OPEN":
        commands.append("cashier is there and cash drawer open is detected")
    elif person_detected==False and drawer_state=="OPEN":
        commands.append("##### cashier is not there but cash drawer open is detected #####")
        activities.append("Suspicious Activity found")

    cv2.imshow("Live Counter Monitor (MVP)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

print(commands)
print(activities)
cap.release()
cv2.destroyAllWindows()
