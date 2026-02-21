import cv2
from ultralytics import YOLO
import mediapipe as mp
import time

# Load YOLOv8
model = YOLO("yolov8n.pt")

# MediaPipe Hands
mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

cap = cv2.VideoCapture(0)

DRAWER_PLACEHOLDER = "laptop"   # you can change to "keyboard"

detected_things=[]

while True:
    ret, frame = cap.read()
    if not ret:
        break

    current_time = time.strftime("%H:%M:%S")

    # ---- YOLO Detection ----
    results = model(frame)
    drawer_detected = False

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            class_name = model.names[cls_id]

            # PERSON
            if class_name == "person":
                detected_things.append(class_name)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"Person {conf:.2f}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # DRAWER PLACEHOLDER
            if class_name == DRAWER_PLACEHOLDER:
                detected_things.append(class_name)
                drawer_detected = True
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(frame, f"Drawer (Placeholder) {conf:.2f}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

    # ---- Hand Detection ----
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        detected_things.append("hands")
        for hand_landmarks in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

    # ---- Status Panel ----
    status_text = f"Time: {current_time} | Drawer Detected: {drawer_detected}"
    cv2.putText(frame, status_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Theft Detection MVP", frame)


    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

       
    
cap.release()
cv2.destroyAllWindows()
print(detected_things) 