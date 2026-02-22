import cv2
import mediapipe as mp
import numpy as np
from ultralytics import YOLO
import time
from collections import deque
import os
import winsound
from datetime import datetime
import threading

# ================== MOCK POS ==================
class MockPOS:
    def __init__(self):
        self.state = "IDLE"  # IDLE / ACTIVE_TXN / BILL_COMPLETED

    def get_state(self):
        return self.state

def play_alarm():
    try:
        winsound.Beep(2500, 600)
    except:
        pass

# ================== LOW LATENCY VIDEO ==================
class VideoStream:
    def __init__(self, src):
        self.stream = cv2.VideoCapture(src)
        self.stream.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.grabbed, self.frame = self.stream.read()
        self.stopped = False
        threading.Thread(target=self.update, daemon=True).start()

    def update(self):
        while not self.stopped:
            self.grabbed, self.frame = self.stream.read()

    def read(self):
        return self.grabbed, self.frame

    def stop(self):
        self.stopped = True
        self.stream.release()

# ================== MAIN SYSTEM ==================
class SmartTheftDetector:
    def __init__(self, camera_source="http://10.182.88.183:8080/video"):
        self.yolo_model = YOLO("yolov8n.pt")

        options = mp.tasks.vision.HandLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path="hand_landmarker.task"),
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_hands=1
        )
        self.landmarker = mp.tasks.vision.HandLandmarker.create_from_options(options)

        self.cap = VideoStream(camera_source)
        time.sleep(1)

        self.width, self.height = 640, 480

        # ================== CLEAN ZONES (FIXED) ==================
        self.DRAWER_ZONE = [
            (int(self.width * 0.38), int(self.height * 0.52)),
            (int(self.width * 0.62), int(self.height * 0.70))
        ]

        self.COUNTER_ZONE = [
            (int(self.width * 0.30), int(self.height * 0.70)),
            (int(self.width * 0.70), int(self.height * 0.80))
        ]

        self.BELOW_COUNTER = [
            (int(self.width * 0.30), int(self.height * 0.82)),
            (int(self.width * 0.70), int(self.height * 0.98))
        ]

        self.ASIDE_ZONE = [
            (int(self.width * 0.05), int(self.height * 0.55)),
            (int(self.width * 0.25), int(self.height * 0.75))
        ]

        # ================== STATE ==================
        self.pos = MockPOS()
        self.initial_drawer_gray = None
        self.is_drawer_open = False
        self.drawer_open_history = deque(maxlen=10)

        self.alert_status = "SYSTEM NORMAL"
        self.alert_color = (0, 255, 0)
        self.last_alert_time = 0
        self.alert_cooldown = 5

        self.cached_persons = []
        self.cached_hands = []
        self.customer_count = 0
        self.frame_count = 0

        os.makedirs("alerts", exist_ok=True)

    # ================== ALERT ==================
    def trigger_alert(self, frame, tag):
        if time.time() - self.last_alert_time > self.alert_cooldown:
            self.last_alert_time = time.time()
            threading.Thread(target=play_alarm, daemon=True).start()
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            cv2.imwrite(f"alerts/{tag}_{ts}.jpg", frame)

    # ================== MAIN LOOP ==================
    def process_frame(self):
        while True:
            ok, frame = self.cap.read()
            if not ok or frame is None:
                continue

            frame = cv2.resize(frame, (self.width, self.height))
            self.frame_count += 1
            self.alert_status = "SYSTEM NORMAL"
            self.alert_color = (0, 255, 0)

            (dx1, dy1), (dx2, dy2) = self.DRAWER_ZONE
            (bx1, by1), (bx2, by2) = self.BELOW_COUNTER
            (ax1, ay1), (ax2, ay2) = self.ASIDE_ZONE

            # -------- Drawer open detection --------
            roi = frame[dy1:dy2, dx1:dx2]
            if roi.size > 0:
                gray = cv2.GaussianBlur(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), (21, 21), 0)
                if self.initial_drawer_gray is None:
                    self.initial_drawer_gray = gray
                else:
                    diff = cv2.absdiff(self.initial_drawer_gray, gray)
                    score = np.sum(cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)[1])
                    was_open = self.is_drawer_open
                    self.is_drawer_open = score > 80000
                    if self.is_drawer_open and not was_open:
                        self.drawer_open_history.append(time.time())

            # -------- Person & hand detection (every 2 frames) --------
            if self.frame_count % 2 == 0:
                self.cached_persons.clear()
                self.cached_hands.clear()
                self.customer_count = 0

                results = self.yolo_model.predict(frame, verbose=False, imgsz=320)
                for r in results:
                    for box in r.boxes:
                        if int(box.cls[0]) == 0:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            cx = (x1 + x2) // 2
                            if cx < self.width * 0.5:
                                label, color = "CASHIER", (255, 0, 0)
                            else:
                                label, color = "CUSTOMER", (0, 255, 0)
                                self.customer_count += 1
                            self.cached_persons.append((x1, y1, x2, y2, label, color))

                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB,
                                  data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                res = self.landmarker.detect(mp_img)
                if res.hand_landmarks:
                    lm = res.hand_landmarks[0][0]
                    self.cached_hands.append((int(lm.x * self.width), int(lm.y * self.height)))

            # -------- Draw persons --------
            for x1, y1, x2, y2, label, color in self.cached_persons:
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, label, (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

            # -------- Hand logic --------
            hand_in_drawer = hand_below = hand_aside = False
            for hx, hy in self.cached_hands:
                cv2.circle(frame, (hx, hy), 4, (0, 0, 255), -1)
                if dx1 < hx < dx2 and dy1 < hy < dy2: hand_in_drawer = True
                if bx1 < hx < bx2 and by1 < hy < by2: hand_below = True
                if ax1 < hx < ax2 and ay1 < hy < ay2: hand_aside = True

            pos = self.pos.get_state()
            now = time.time()
            recent_opens = sum(1 for t in self.drawer_open_history if now - t < 60)

            if recent_opens >= 3:
                self.alert_status = "ALERT: MULTIPLE DRAWER OPENS"
                self.alert_color = (0, 0, 255)
                self.trigger_alert(frame, "multi_open")

            elif self.is_drawer_open and pos == "IDLE":
                self.alert_status = "ALERT: DRAWER OPEN + IDLE"
                self.alert_color = (0, 0, 255)
                self.trigger_alert(frame, "open_idle")

            elif hand_in_drawer and pos == "BILL_COMPLETED":
                self.alert_status = "ALERT: HAND AFTER BILL"
                self.alert_color = (0, 0, 255)
                self.trigger_alert(frame, "after_bill")

            elif hand_below and self.is_drawer_open:
                self.alert_status = "ALERT: HAND BELOW COUNTER"
                self.alert_color = (0, 0, 255)
                self.trigger_alert(frame, "below_counter")

            elif hand_aside and self.is_drawer_open:
                self.alert_status = "ALERT: CASH ASIDE"
                self.alert_color = (0, 0, 255)
                self.trigger_alert(frame, "aside")

            # -------- Draw zones --------
            cv2.rectangle(frame, self.DRAWER_ZONE[0], self.DRAWER_ZONE[1], (0, 255, 255), 2)
            cv2.putText(frame, "DRAWER", (dx1, dy1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

            cv2.rectangle(frame, self.BELOW_COUNTER[0], self.BELOW_COUNTER[1], (255, 0, 255), 2)
            cv2.putText(frame, "BELOW COUNTER", (bx1, by1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)

            cv2.rectangle(frame, self.ASIDE_ZONE[0], self.ASIDE_ZONE[1], (255, 165, 0), 2)
            cv2.putText(frame, "ASIDE", (ax1, ay1 - 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 165, 0), 2)

            # -------- Header --------
            cv2.rectangle(frame, (0, 0), (self.width, 70), (0, 0, 0), -1)
            cv2.putText(frame, f"POS: {pos} | DRAWER: {'OPEN' if self.is_drawer_open else 'CLOSED'}",
                        (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, self.alert_status,
                        (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.7, self.alert_color, 2)

            cv2.imshow("SMART THEFT DETECTOR (CLEAN ZONES)", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'): break
            elif key == ord('i'): self.pos.state = "IDLE"
            elif key == ord('a'): self.pos.state = "ACTIVE_TXN"
            elif key == ord('b'): self.pos.state = "BILL_COMPLETED"

        self.cap.stop()
        cv2.destroyAllWindows()

# ================== RUN ==================
if __name__ == "__main__":
    SmartTheftDetector().process_frame()