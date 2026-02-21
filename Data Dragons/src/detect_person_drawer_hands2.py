import cv2
from ultralytics import YOLO
import mediapipe as mp
import time

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

DRAWER_PLACEHOLDER = "laptop"

prev_drawer_area = None
drawer_state = "UNKNOWN"
DRAWER_OPEN_THRESHOLD = 1.75  # 25% area increase = open

while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.strftime("%H:%M:%S")

    results = model(frame)
    drawer_detected = False

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_name = model.names[cls_id]

            if class_name == "person":
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, "Person", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            if class_name == DRAWER_PLACEHOLDER:
                drawer_detected = True
                area = (x2 - x1) * (y2 - y1)

                if prev_drawer_area is not None:
                    if area > prev_drawer_area * DRAWER_OPEN_THRESHOLD:
                        drawer_state = "OPEN"
                    elif area < prev_drawer_area * 1.10:
                        drawer_state = "CLOSED"

                prev_drawer_area = area

                color = (0, 0, 255) if drawer_state == "OPEN" else (255, 0, 0)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"Drawer {drawer_state}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Hand detection
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    cv2.putText(frame, f"Time: {current_time}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Drawer State Tracking (MVP)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()