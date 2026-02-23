import cv2
import requests
import time
from face_module.encoder import build_face_database
from face_module.recognizer import FaceRecognizer

# --- Cloud Server Configuration ---
VIDEO_URL = "http://64.227.160.247:8000/upload_frame_2"
STATUS_URL = "http://64.227.160.247:8000/set_cashier_status"

def main():
    database = build_face_database()
    recognizer = FaceRecognizer(database)

    video_capture = cv2.VideoCapture(0)
    
    # Force webcam to a lower resolution for smooth streaming
    video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print(f"🚀 Cashier Auth Node Active!")
    print(f"📡 Broadcasting Video to: {VIDEO_URL}")
    print(f"📡 Sending Status to: {STATUS_URL}")

    last_status_time = 0
    current_status = "SCANNING..."

    while True:
        ret, frame = video_capture.read()

        if not ret:
            print("Camera disconnected!")
            break

        # 1. Catch BOTH the frame and the status from Aadil's updated module!
        frame, auth_status = recognizer.recognize_faces(frame)

        # If auth_status is None (still booting up), default to SCANNING
        new_status = auth_status if auth_status else "SCANNING..."

        # 2. Send Status to Dashboard (Max 1 update per second)
        if time.time() - last_status_time > 1.0 or new_status != current_status:
            try:
                requests.post(STATUS_URL, json={"status": new_status}, timeout=0.5)
                last_status_time = time.time()
                current_status = new_status
            except:
                pass # Silently drop network errors

        # 3. Compress and Stream Video to the React Dashboard
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
        try:
            requests.post(VIDEO_URL, data=buffer.tobytes(), timeout=0.5)
        except Exception as e:
            pass 

        # 4. Local Laptop Display
        cv2.imshow("Cashier Authentication System", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    try:
        requests.post(STATUS_URL, json={"status": "OFFLINE"}, timeout=0.5)
    except:
        pass

    video_capture.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()