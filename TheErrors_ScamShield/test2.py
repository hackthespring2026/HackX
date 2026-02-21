import cv2
import mediapipe as mp
from ultralytics import YOLO
import time
import os
import datetime
import winsound

# ================== SETUP ==================
os.makedirs("alerts", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# ================== YOLO ==================
yolo_model = YOLO("yolov8n.pt")

# ================== MEDIAPIPE TASKS ==================
BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# ---- Hand Landmarker ----
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions

hand_options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="hand_landmarker.task"),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=2
)
hand_landmarker = HandLandmarker.create_from_options(hand_options)

# ---- Pose Landmarker ----
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions

pose_options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="pose_landmarker.task"),
    running_mode=VisionRunningMode.VIDEO
)
pose_landmarker = PoseLandmarker.create_from_options(pose_options)

# ================== CAMERA ==================
cap = cv2.VideoCapture(0)

# ================== POS ==================
pos_drawer_open = False

# ================== TIMERS ==================
drawer_entry_time = None
drawer_event_time = None
drawer_open_start_time = None
last_alert_time = 0

DRAWER_TIME_THRESHOLD = 1.2
SEQUENCE_WINDOW = 4.0
DRAWER_OPEN_TIME_LIMIT = 10.0
ALERT_COOLDOWN = 2

mp_timestamp_ms = 0

# ================== ROIs ==================
drawer_roi = (200, 240, 380, 340)

# ================== HELPERS ==================
def log_event(severity, msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("logs/security_alerts.log", "a", encoding="utf-8") as f:
        f.write(f"[{ts}] [{severity}] {msg}\n")

def point_in_box(x, y, box):
    x1, y1, x2, y2 = box
    return x1 < x < x2 and y1 < y < y2

# ================== MAIN LOOP ==================
while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape
    now = time.time()

    # -------- Drawer ROI --------
    cv2.rectangle(frame, drawer_roi[:2], drawer_roi[2:], (0, 255, 255), 2)

    # -------- Pose Detection (Pocket Zones) --------
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pose_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    pose_result = pose_landmarker.detect_for_video(pose_image, mp_timestamp_ms)

    pocket_boxes = []

    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks[0]

        lhx, lhy = int(lm[23].x * w), int(lm[23].y * h)
        rhx, rhy = int(lm[24].x * w), int(lm[24].y * h)
        lsx, rsx = int(lm[11].x * w), int(lm[12].x * w)
        lky = int(lm[25].y * h)

        torso_width = abs(rsx - lsx)
        pocket_width = int(torso_width * 0.20)
        pocket_height = int(abs(lky - lhy) * 0.45)
        POCKET_GAP = int(torso_width * 0.18)

        center_x = int((lhx + rhx) / 2)
        y_top = lhy + int(pocket_height * 0.1)

        left_pocket = (
            center_x - POCKET_GAP - pocket_width,
            y_top,
            center_x - POCKET_GAP,
            y_top + pocket_height
        )

        right_pocket = (
            center_x + POCKET_GAP,
            y_top,
            center_x + POCKET_GAP + pocket_width,
            y_top + pocket_height
        )

        pocket_boxes = [left_pocket, right_pocket]

        for b in pocket_boxes:
            cv2.rectangle(frame, (b[0], b[1]), (b[2], b[3]), (180, 0, 255), 2)

    # -------- Hand Detection --------
    hand_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    hand_result = hand_landmarker.detect_for_video(hand_image, mp_timestamp_ms)
    mp_timestamp_ms += 1

    hands_in_drawer = False
    hands_in_pocket = False

    if hand_result.hand_landmarks:
        for hand in hand_result.hand_landmarks:
            for lm in hand:
                hx, hy = int(lm.x * w), int(lm.y * h)
                cv2.circle(frame, (hx, hy), 4, (0, 0, 255), -1)

                if point_in_box(hx, hy, drawer_roi):
                    hands_in_drawer = True

                for pb in pocket_boxes:
                    if point_in_box(hx, hy, pb):
                        hands_in_pocket = True

    # -------- Drawer Event (always tracked) --------
    if hands_in_drawer:
        drawer_entry_time = drawer_entry_time or now
        if now - drawer_entry_time > DRAWER_TIME_THRESHOLD:
            drawer_event_time = now
    else:
        drawer_entry_time = None

    # -------- Drawer Open Too Long --------
    if pos_drawer_open and hands_in_drawer:
        drawer_open_start_time = drawer_open_start_time or now
    else:
        drawer_open_start_time = None

    # -------- SEVERITY LOGIC --------
    severity = "NORMAL"
    message = "Normal operation"
    color = (0, 255, 0)

    # 🔴 THEFT
    if drawer_event_time and hands_in_pocket:
        if now - drawer_event_time <= SEQUENCE_WINDOW:
            severity = "THEFT"
            message = "Drawer to pocket sequence detected"
            color = (0, 0, 255)
            drawer_event_time = None

    # 🟡 SUSPICIOUS: Drawer open too long
    elif drawer_open_start_time and (now - drawer_open_start_time > DRAWER_OPEN_TIME_LIMIT):
        severity = "SUSPICIOUS"
        message = "Drawer left open too long"
        color = (0, 165, 255)

    # 🟡 SUSPICIOUS: Unauthorized drawer access
    elif hands_in_drawer and not pos_drawer_open:
        severity = "SUSPICIOUS"
        message = "Unauthorized drawer access"
        color = (0, 165, 255)

    # -------- ACTIONS --------
    if severity == "THEFT":
        cv2.putText(frame, f"ALERT: {severity}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 3)

        if now - last_alert_time > ALERT_COOLDOWN:
            winsound.Beep(1500, 500)
            last_alert_time = now
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            cv2.imwrite(f"alerts/theft_{ts}.jpg", frame)
            log_event(severity, message)

    elif severity == "SUSPICIOUS":
        cv2.putText(frame, f"WARNING: {severity}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        log_event(severity, message)

    else:
        cv2.putText(frame, "Status: NORMAL", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    # -------- POS DISPLAY --------
    pos_text = "POS: OPEN" if pos_drawer_open else "POS: CLOSED"
    cv2.putText(frame, pos_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                (0, 255, 0) if pos_drawer_open else (0, 0, 255), 2)

    cv2.imshow("Severity-Based Theft Detection", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('o'):
        pos_drawer_open = True
    elif key == ord('c'):
        pos_drawer_open = False

cap.release()
cv2.destroyAllWindows()