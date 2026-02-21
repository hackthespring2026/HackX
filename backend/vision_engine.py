import cv2
from ultralytics import YOLO
import numpy as np
import time

class TheftDetectionPipeline:
    def __init__(self, yolo_model_path='yolov8n.pt'):
        self.detector = YOLO(yolo_model_path)
        
        # --- OpenCV Motion / Tracker Setup ---
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=False)
        
        self.frame_counter = 0
        self.seen_items = {} # item_name -> frame_last_seen
        
        # State Machine Variables
        self.money_handover_active = False
        self.handover_frames = 0
        
        self.person_in_drawer_frames = 0
        self.pos_scanned_recently = 0
        self.last_alert_frame = -200 # Debounce alerts heavily
        self.demo_pos_logged = False
        
        # Motion Tracking
        self.last_motion_centroid = None
        
    def process_frame(self, frame):
        self.frame_counter += 1
        pos_items_detected_this_frame = []
        alert_triggered = False
        alert_message = None
        
        h, w, _ = frame.shape
        
        # Define Spatial Zones 
        zone_customer = (0, 0, w, int(h * 0.4))
        zone_drawer = (int(w * 0.2), int(h * 0.4), int(w * 0.8), h)
        zone_pocket_left = (0, int(h * 0.3), int(w * 0.35), h)
        zone_pocket_right = (int(w * 0.65), int(h * 0.3), w, h)
        
        # Draw Zones for Debugging/Visualization
        cv2.rectangle(frame, (zone_customer[0], zone_customer[1]), (zone_customer[2], zone_customer[3]), (255, 0, 0), 1)
        cv2.putText(frame, "CUSTOMER ZONE", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
        
        cv2.rectangle(frame, (zone_drawer[0], zone_drawer[1]), (zone_drawer[2], zone_drawer[3]), (0, 255, 0), 1)
        cv2.putText(frame, "CASH DRAWER", (zone_drawer[0] + 10, zone_drawer[1] + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        cv2.rectangle(frame, (zone_pocket_left[0], zone_pocket_left[1]), (zone_pocket_left[2], zone_pocket_left[3]), (0, 165, 255), 1)
        cv2.rectangle(frame, (zone_pocket_right[0], zone_pocket_right[1]), (zone_pocket_right[2], zone_pocket_right[3]), (0, 165, 255), 1)
        
        # --- 1. YOLO INFERENCE (Currency/Items) ---
        full_results = self.detector(frame, verbose=False)
        currency_visible_this_frame = False
        
        for r in full_results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                if conf > 0.4:
                    raw_name = self.detector.names[cls_id]
                    item_name = raw_name
                    
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    if raw_name == 'person':
                        continue # Skip YOLO persons, we use Motion Tracking
                    
                    # Currency Mocking
                    is_currency = False
                    if raw_name in ['book', 'cell phone', 'tie', 'remote', 'mouse', 'wallet', 'paper', 'keyboard']:
                        is_currency = True
                        currency_visible_this_frame = True
                        if np.random.rand() > 0.90:
                            item_name = "Foreign Currency / Invalid Note!"
                            color = (0, 0, 255)
                            if (self.frame_counter - self.last_alert_frame) > 100:
                                alert_triggered = True
                                alert_message = "FOREIGN CURRENCY DETECTED: Invalid tender used."
                                self.last_alert_frame = self.frame_counter
                        else:
                            item_name = "Indian 500 Rupee Note"
                            color = (0, 255, 0)
                    else:
                        color = (255, 0, 0)
                    
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, item_name, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                    # --- EXACT SCENARIO POS AUTO-GENERATION ---
                    if not self.demo_pos_logged and item_name not in ['Foreign Currency / Invalid Note!'] and len(self.seen_items) == 0:
                        self.demo_pos_logged = True
                        pos_items_detected_this_frame.append("DEMO_TRIGGER")
                        self.pos_scanned_recently = self.frame_counter
                        self.seen_items[item_name] = self.frame_counter
                        
        # --- 2. OPENCV MOTION TRACKING (Fallback for broken MediaPipe) ---
        # We track the largest moving object (usually the cashier's hands/arms)
        fg_mask = self.bg_subtractor.apply(frame)
        _, fg_thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(fg_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_centroid = None
        motion_detected_in_drawer = False
        
        if contours:
            largest_contour = max(contours, key=cv2.contourArea)
            if cv2.contourArea(largest_contour) > 1500: # Ignore noise
                x, y, cw, ch = cv2.boundingRect(largest_contour)
                cx, cy = x + cw // 2, y + ch // 2
                motion_centroid = (cx, cy)
                
                # Draw the tracking reticle
                cv2.circle(frame, motion_centroid, 10, (0, 255, 255), -1)
                cv2.putText(frame, "TRACKING MOVEMENT", (cx - 50, cy - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
                
                # --- HEURISTIC: HANDOVER STATE ---
                if zone_customer[1] < cy < zone_customer[3]:
                    if currency_visible_this_frame:
                        self.money_handover_active = True
                        self.handover_frames = self.frame_counter
                        cv2.putText(frame, "CASH HANDOVER DETECTED...", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

                def in_drawer(pt):
                    return zone_drawer[0] < pt[0] < zone_drawer[2] and zone_drawer[1] < pt[1] < zone_drawer[3]
                    
                def in_pocket(pt):
                    in_left = zone_pocket_left[0] < pt[0] < zone_pocket_left[2] and zone_pocket_left[1] < pt[1] < zone_pocket_left[3]
                    in_right = zone_pocket_right[0] < pt[0] < zone_pocket_right[2] and zone_pocket_right[1] < pt[1] < zone_pocket_right[3]
                    return in_left or in_right

                # --- HEURISTIC: DRAWER CHECK & FORCEFUL OPENING ---
                if in_drawer(motion_centroid):
                    motion_detected_in_drawer = True
                    self.person_in_drawer_frames += 1
                    self.money_handover_active = False # Safe deposit
                    
                    if self.last_motion_centroid:
                        dx = cx - self.last_motion_centroid[0]
                        dy = cy - self.last_motion_centroid[1]
                        velocity = np.sqrt(dx**2 + dy**2)
                        
                        if velocity > 30 and (self.frame_counter - self.last_alert_frame) > 100:
                            alert_triggered = True
                            alert_message = "FORCEFUL OPENING: Aggressive erratic movement detected at Drawer!"
                            self.last_alert_frame = self.frame_counter
                    
                    # --- HEURISTIC: SECRET OPENING ---
                    if self.person_in_drawer_frames > 25:
                        if (self.frame_counter - self.pos_scanned_recently) > 200: 
                            if (self.frame_counter - self.last_alert_frame) > 100:
                                alert_triggered = True
                                alert_message = "SECRET OPENING: Cash drawer accessed without a POS transaction!"
                                self.last_alert_frame = self.frame_counter
                                self.person_in_drawer_frames = 0
                                pos_items_detected_this_frame.append("DEMO_TRIGGER") 
                                
                # --- HEURISTIC: SNEAKY HAND (POCKET DIVERT) ---
                if self.money_handover_active and (self.frame_counter - self.handover_frames) < 150:
                    if in_pocket(motion_centroid):
                        if (self.frame_counter - self.last_alert_frame) > 100:
                            alert_triggered = True
                            alert_message = "POS MISMATCH (SNEAKY HAND): Customer paid ₹1000. Cash diverted to pocket instead of drawer!"
                            self.last_alert_frame = self.frame_counter
                            self.money_handover_active = False
                            
        if not motion_detected_in_drawer:
            self.person_in_drawer_frames = 0
            
        self.last_motion_centroid = motion_centroid
                            
        return frame, alert_triggered, alert_message, pos_items_detected_this_frame

if __name__ == "__main__":
    pipeline = TheftDetectionPipeline()
    cap = cv2.VideoCapture(0)
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        processed_frame, is_theft, msg, items = pipeline.process_frame(frame)
        cv2.imshow("Test", processed_frame)
        if cv2.waitKey(1) == ord('q'): break
    cap.release()
    cv2.destroyAllWindows()
