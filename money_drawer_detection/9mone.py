
import cv2
from ultralytics import YOLO
import sys

# Load your custom model
model = YOLO('bestmon.pt') 

cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    # Run detection
    results = model.predict(frame, conf=0.5, verbose=False)

    # --- THE FIX: Create the annotated frame ---
    # results[0].plot() takes the original frame and draws the boxes on it
    annotated_frame = results[0].plot() 

    # Show the frame with the boxes
    cv2.imshow("Currency Monitor", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
sys.exit(0)