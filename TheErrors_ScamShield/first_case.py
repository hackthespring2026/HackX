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
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5
)
hand_landmarker = HandLandmarker.create_from_options(hand_options)

# ---- Pose Landmarker ----
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions

pose_options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path="pose_landmarker.task"),
    running_mode=VisionRunningMode.VIDEO,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5
)
pose_landmarker = PoseLandmarker.create_from_options(pose_options)

# ================== CAMERA ==================
cap = cv2.VideoCapture(0)

# ================== POS ==================
pos_drawer_open = False

# ================== TIMERS ==================
drawer_entry_time = None
pocket_entry_time = None
last_alert_time = 0

DRAWER_TIME_THRESHOLD = 1.5
POCKET_TIME_THRESHOLD = 1.2
ALERT_COOLDOWN = 2

mp_timestamp_ms = 0

# ================== DRAWER ROI ==================
drawer_roi = (150, 200, 450, 400)

# ================== HELPERS ==================
def log_alert(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("logs/security_alerts.log", "a") as f:
        f.write(f"[{ts}] {msg}\n")

def point_in_box(x, y, box):
    x1, y1, x2, y2 = box
    return x1 < x < x2 and y1 < y < y2

# ================== MAIN LOOP ==================
while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape
    current_time = time.time()

    # -------- Drawer ROI --------
    cv2.rectangle(frame, (drawer_roi[0], drawer_roi[1]),
                  (drawer_roi[2], drawer_roi[3]), (0, 255, 255), 2)

    # -------- Person Detection --------
    results = yolo_model(frame, verbose=False)[0]
    for r in results.boxes:
        if int(r.cls[0]) == 0 and float(r.conf[0]) > 0.5:
            x1, y1, x2, y2 = map(int, r.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            break

    # -------- Pose Detection (NO OVERLAP POCKETS) --------
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_pose_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    pose_result = pose_landmarker.detect_for_video(mp_pose_image, mp_timestamp_ms)

    pocket_boxes = []

    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks[0]

        L_HIP, R_HIP = lm[23], lm[24]
        L_KNEE = lm[25]
        L_SHOULDER, R_SHOULDER = lm[11], lm[12]

        lhx, lhy = int(L_HIP.x * w), int(L_HIP.y * h)
        rhx, rhy = int(R_HIP.x * w), int(R_HIP.y * h)
        lky = int(L_KNEE.y * h)
        lsx = int(L_SHOULDER.x * w)
        rsx = int(R_SHOULDER.x * w)

        body_center_x = int((lhx + rhx) / 2)
        torso_width = abs(rsx - lsx)

        pocket_width = int(torso_width * 0.16)
        pocket_height = int(abs(lky - lhy) * 0.35)

        MIN_GAP = int(torso_width * 0.12)  # <<< KEY FIX

        y_top = lhy + int(pocket_height * 0.15)

        # Left pocket (forced left of center)
        left_pocket = (
            body_center_x - MIN_GAP - pocket_width,
            y_top,
            body_center_x - MIN_GAP,
            y_top + pocket_height
        )

        # Right pocket (forced right of center)
        right_pocket = (
            body_center_x + MIN_GAP,
            y_top,
            body_center_x + MIN_GAP + pocket_width,
            y_top + pocket_height
        )

        pocket_boxes = [left_pocket, right_pocket]

        for box in pocket_boxes:
            cv2.rectangle(frame, (box[0], box[1]),
                          (box[2], box[3]), (180, 0, 255), 2)

    # -------- Hand Detection --------
    mp_hand_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    hand_result = hand_landmarker.detect_for_video(mp_hand_image, mp_timestamp_ms)
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

    # -------- Timers --------
    drawer_entry_time = drawer_entry_time or (current_time if hands_in_drawer else None)
    pocket_entry_time = pocket_entry_time or (current_time if hands_in_pocket else None)

    if not hands_in_drawer:
        drawer_entry_time = None
    if not hands_in_pocket:
        pocket_entry_time = None

    # -------- Decision --------
    alert_type = None
    status_text = "Idle"
    status_color = (200, 200, 200)

    if hands_in_drawer and not pos_drawer_open:
        if current_time - drawer_entry_time > DRAWER_TIME_THRESHOLD:
            alert_type = "UNAUTHORIZED DRAWER ACCESS"

    elif pos_drawer_open and hands_in_pocket:
        if current_time - pocket_entry_time > POCKET_TIME_THRESHOLD:
            alert_type = "CASH POCKETING DETECTED"

    elif pos_drawer_open and hands_in_drawer:
        status_text = "Normal Transaction"
        status_color = (0, 255, 0)

    # -------- Alerts --------
    if alert_type:
        cv2.putText(frame, f"ALERT: {alert_type}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)

        if current_time - last_alert_time > ALERT_COOLDOWN:
            winsound.Beep(1500, 500)
            last_alert_time = current_time
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            cv2.imwrite(f"alerts/theft_{ts}.jpg", frame)
            log_alert(alert_type)
    else:
        cv2.putText(frame, f"Status: {status_text}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

    # -------- POS --------
    pos_text = "POS: OPEN" if pos_drawer_open else "POS: CLOSED"
    cv2.putText(frame, pos_text, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8,
                (0, 255, 0) if pos_drawer_open else (0, 0, 255), 2)

    cv2.imshow("Clean Dynamic Pocket Detection", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('o'):
        pos_drawer_open = True
    elif key == ord('c'):
        pos_drawer_open = False

cap.release()
cv2.destroyAllWindows()