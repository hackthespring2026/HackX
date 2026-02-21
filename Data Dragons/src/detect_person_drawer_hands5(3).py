import cv2
from ultralytics import YOLO
import time

model = YOLO("yolov8n.pt")
cap = cv2.VideoCapture(0)

DRAWER_PLACEHOLDER = "laptop"

# Calibrate this box to where your drawer is when OPEN
DRAWER_ZONE = (150, 200, 550, 450)  # x1, y1, x2, y2

drawer_state = "UNKNOWN"

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

    zx1, zy1, zx2, zy2 = DRAWER_ZONE
    cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), (255, 255, 0), 2)
    cv2.putText(frame, "DRAWER ZONE (OPEN Position)", (zx1, zy1 - 10),
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
                drawer_box = (x1, y1, x2, y2)

                overlap = overlap_ratio(drawer_box, DRAWER_ZONE)

                # 🔁 Flipped Logic:
                if overlap > 0.6:   # >60% inside zone = OPEN
                    drawer_state = "OPEN"
                    color = (0, 0, 255)
                else:
                    drawer_state = "CLOSED"
                    color = (255, 0, 0)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"Drawer {drawer_state} ({overlap:.2f})", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    if not drawer_detected:
        drawer_state = "Closed"

    cv2.putText(frame, f"Drawer State: {drawer_state}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    cv2.imshow("Drawer State (Flipped Logic)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()