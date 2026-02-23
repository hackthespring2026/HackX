import cv2
import requests
import numpy as np
from ultralytics import YOLO
import time

# Configuration
BACKEND_URL = "http://localhost:8001"
UPLOAD_ENDPOINT = f"{BACKEND_URL}/upload_frame"
CAMERA_INDEX = 0  # Change to different index if you have multiple cameras
CONFIDENCE_THRESHOLD = 0.5

print("🎥 Starting YOLO Camera Detection Script...")

# Load YOLO model (downloads automatically on first run)
print("📦 Loading YOLO model (this may take a moment)...")
model = YOLO("yolov8n.pt")  # nano model - fastest, use yolov8s/m/l for better accuracy
print("✅ YOLO model loaded!")

# Open camera
cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print("❌ Error: Could not open camera. Check if camera is connected.")
    exit(1)

# Set camera properties for better performance
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

print("✅ Camera opened successfully!")
print(f"📤 Uploading frames to {UPLOAD_ENDPOINT}")

frame_count = 0
last_time = time.time()

try:
    while True:
        ret, frame = cap.read()
        
        if not ret:
            print("❌ Failed to read frame from camera")
            break
        
        # Run YOLO detection
        results = model(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
        
        # Draw detections on frame
        annotated_frame = results[0].plot()
        
        # Encode frame to JPEG
        success, buffer = cv2.imencode('.jpg', annotated_frame)
        
        if success:
            # Send frame to backend
            try:
                response = requests.post(
                    UPLOAD_ENDPOINT,
                    data=buffer.tobytes(),
                    headers={'Content-Type': 'image/jpeg'},
                    timeout=2
                )
                if response.status_code == 200:
                    frame_count += 1
                    
                    # Print stats every 30 frames
                    if frame_count % 30 == 0:
                        elapsed = time.time() - last_time
                        fps = 30 / elapsed
                        print(f"📊 Frames sent: {frame_count} | FPS: {fps:.1f}")
                        last_time = time.time()
                else:
                    print(f"⚠️  Server returned status: {response.status_code}")
            except requests.exceptions.ConnectionError:
                print("❌ Error: Could not connect to backend. Is it running on 8001?")
                break
            except requests.exceptions.Timeout:
                print("⚠️  Timeout sending frame (backend may be slow)")
            except Exception as e:
                print(f"⚠️  Error sending frame: {e}")
        
        # Optional: Display frame locally (comment out if not needed)
        # cv2.imshow('YOLO Detection', annotated_frame)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break

except KeyboardInterrupt:
    print("\n⏹️  Stopping...")
finally:
    cap.release()
    # cv2.destroyAllWindows()
    print(f"✅ Stopped. Total frames sent: {frame_count}")
