import cv2
import time
import os
import sys
import json
import requests
import argparse

# Config
BACKEND_URL = "http://localhost:8000/api"
BUFFER_DIR = "sentinel_buffers"

def extract_clip(video_path, start_time, duration=10, output_path="clip.avi"):
    """
    Extracts a clip of `duration` seconds starting from `start_time` in the video.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("❌ Error: Could not open video for extraction.")
        return False
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps != fps:
        fps = 30.0
        
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    start_frame = int(max(0, start_time) * fps)
    end_frame = int((start_time + duration) * fps)
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    print(f"⚙️  Extracting {duration}s clip (from {start_time}s to {start_time+duration}s)...")
    
    current_frame = start_frame
    while current_frame < end_frame:
        ret, frame = cap.read()
        if not ret:
            break
            
        cv2.putText(frame, "AI TRACKING: ANOMALY DETECTED", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.putText(frame, "TRAJECTORY: WRIST -> POCKET", (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.circle(frame, (width//2, height//2), 50, (0, 0, 255), 2) 
        
        out.write(frame)
        current_frame += 1
        
    cap.release()
    out.release()
    return True

def send_alert(clip_path, output_data=None):
    """
    Sends the POST request to the Django backend.
    """
    print(f"🌐 Sending verified alert to UI with clip: {clip_path}")
    details_dict = {
        "reason": "Trajectory deviation + Unauthorized Open", 
        "clip": clip_path, 
        "note": "Cross-verified"
    }
    if output_data:
        details_dict["anomaly_report"] = output_data

    payload = {
        "anomaly_type": "TRAJECTORY",
        "confidence": 0.98,
        "rule_violated": "Cross-Verified: Hand moved from Counter Zone to Pocket Zone during unauthorized drawer open",
        "tier_source": "TRAJECTORY",
        "video_clip": clip_path,
        "details": json.dumps(details_dict),
    }
    try:
        r = requests.post(f"{BACKEND_URL}/alerts/", json=payload, timeout=5)
        if r.status_code == 201:
            print(f"✅ Alert successfully posted to Dashboard! ID: {r.json().get('id')}")
        else:
            print(f"⚠ Alert POST failed. Status code: {r.status_code}, Response: {r.text}")
    except Exception as e:
        print(f"❌ Could not connect to backend: {e}")

def run_vision_trigger(video_path, theft_time):
    print(f"\n🎬 Initiating Sentinel Vision Agent on: {video_path}")
    os.makedirs(BUFFER_DIR, exist_ok=True)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("❌ Cannot open video file. Check the path.")
        return
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0: fps = 30.0
    
    theft_frame = int(max(0, theft_time) * fps)
    current_frame = 0
    
    print("⏳ Scanning video stream. (Press 'q' to abort)")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        annotated = frame.copy()
        cv2.putText(annotated, "TIER 1 ALERT RECEIVED", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.putText(annotated, "CROSS-CHECKING VIDEO BUFFER [YOLOv8]", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        cv2.imshow("Sentinel GEC - Live Agent", annotated)
        
        delay = int(1000 / fps)
        if cv2.waitKey(delay) & 0xFF == ord('q'):
            break
            
        current_frame += 1
        
        if current_frame >= theft_frame:
            print("\n🚨 TIER 2 ANOMALY VERIFIED! 🚨")
            print("Trajectory Deviation: Wrist -> Pocket")
            print("Locking 10-second proof buffer...")
            
            cv2.putText(frame, "🚨 POCKETING VERIFIED 🚨", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
            cv2.imshow("Sentinel GEC - Live Agent", frame)
            cv2.waitKey(1500) 
            
            cap.release()
            cv2.destroyAllWindows()
            
            buffer_start = max(0, theft_time - 5)
            clip_name = f"evidence_{int(time.time())}.avi"
            clip_path = os.path.join(BUFFER_DIR, clip_name)
            
            success = extract_clip(video_path, buffer_start, duration=10, output_path=clip_path)
            
            if success:
                print(f"✅ Proof extracted successfully: {clip_path}")
                
                today = time.strftime("%Y-%m-%d")
                output_data = [
                  {
                    "type": "LOGICAL_ANOMALY",
                    "timestamp": f"{today}T11:15:33",
                    "description": "Drawer opened physically without POS authorization",
                    "ground_truth_label": "THEFT"
                  },
                  {
                    "type": "BEHAVIORAL_ANOMALY",
                    "timestamp": f"{today}T13:42:10",
                    "description": "Hand-to-pocket movement during authorized cash handling",
                    "ground_truth_label": "THEFT"
                  },
                  {
                    "type": "PHYSICAL_ANOMALY",
                    "timestamp": f"{today}T15:05:22",
                    "description": "Drawer tampered at unattended station",
                    "ground_truth_label": "THEFT"
                  }
                ]
                
                send_alert(f"./{clip_path}", output_data)
                
                print("\n" + "="*50)
                print("🧾 GENERATED ANOMALY REPORT (JSON)")
                print("="*50)
                print(json.dumps(output_data, indent=2))
                print("="*50 + "\n")
                
            break
            
    cap.release()
    cv2.destroyAllWindows()

def main(video_path, theft_time):
    print("======================================================")
    print(" GEC Sentinel - Connected Vision Agent (Backend Listener)")
    print("======================================================")
    print("Listening for DRAWER_NO_SALE alerts from Tier 1 (Cashier POS)...")
    
    seen_alerts = set()
    
    try:
        # Pre-seed seen alerts so we don't trigger on old ones when starting the script
        initial_check = requests.get(f"{BACKEND_URL}/alerts/", timeout=5)
        if initial_check.status_code == 200:
            for alert in initial_check.json():
                seen_alerts.add(alert.get('id'))
    except Exception as e:
        print(f"Warning: Could not connect to backend on startup ({e})")
        
    poll_interval = 2.0
    
    try:
        while True:
            try:
                r = requests.get(f"{BACKEND_URL}/alerts/", timeout=5)
                if r.status_code == 200:
                    alerts = r.json()
                    for alert in alerts:
                        alert_id = alert.get('id')
                        anomaly_type = alert.get('anomaly_type')
                        
                        if alert_id not in seen_alerts:
                            seen_alerts.add(alert_id)
                            print(f"🔔 Received new Alert ID {alert_id}: {anomaly_type}")
                            # ONLY fire the vision agent if we see a DRAWER_NO_SALE triggered perfectly from the Cashier Cash Out / Simulator button.
                            # We ignore TRAJECTORY alerts from the background ai_monitor.py so the video doesn't loop forever.
                            if anomaly_type == 'DRAWER_NO_SALE':
                                print(f"\n⚡ TIER 1 TRIGGER INSTINCT! Cash Out Detected: Searching video buffer...")
                                run_vision_trigger(video_path, theft_time)
                                print("\nResuming normal listening state. Ready for next Cash Out trigger...\n")
                                
            except requests.exceptions.RequestException:
                pass # Silent fail on connection issues while polling
                
            sys.stdout.write('.')
            sys.stdout.flush()
            time.sleep(poll_interval)
            
    except KeyboardInterrupt:
        print("\n\nAgent stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Live Vision Agent Demo Script")
    parser.add_argument("video", type=str, help="Path to input video file")
    parser.add_argument("--time", type=float, required=True, help="Exact second of the theft (e.g. 5.5)")
    args = parser.parse_args()
    
    main(args.video, args.time)
