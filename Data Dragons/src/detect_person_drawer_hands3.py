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

# Define fixed drawer zone (adjust these values based on your camera view)
DRAWER_ZONE = (50, 100, 620, 470)

drawer_state = "UNKNOWN"

while True:
    ret, frame = cap.read()
    if not ret:
        break

    display_time = time.strftime("%H:%M:%S")

    # Draw drawer zone
    zx1, zy1, zx2, zy2 = DRAWER_ZONE
    cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), (255, 255, 0), 2)
    cv2.putText(frame, "DRAWER ZONE (Closed Position)", (zx1, zy1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)

    results = model(frame)
    drawer_detected = False

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            class_name = model.names[cls_id]

            if class_name == DRAWER_PLACEHOLDER:
                drawer_detected = True

                # Center of laptop box
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)

                # Check if inside drawer zone
                if zx1 < cx < zx2 and zy1 < cy < zy2:
                    drawer_state = "CLOSED"
                    color = (255, 0, 0)
                else:
                    drawer_state = "OPEN"
                    color = (0, 0, 255)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"Drawer {drawer_state}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    if not drawer_detected:
        drawer_state = "UNKNOWN"

    cv2.putText(frame, f"Drawer State: {drawer_state}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Drawer Open/Close (Zone Based MVP)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()