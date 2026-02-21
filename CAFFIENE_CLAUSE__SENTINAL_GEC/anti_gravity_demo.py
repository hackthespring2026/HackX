import cv2
import time
import os
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
    
    # Using XVID / .avi for compatibility with the existing OpenCV setup, 
    # but you can change to mp4v/.mp4 if needed.
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    print(f"⚙️  Extracting {duration}s clip (from {start_time}s to {start_time+duration}s)...")
    
    current_frame = start_frame
    while current_frame < end_frame:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Add "AI processing" overlay for the "wow" factor
        cv2.putText(frame, "AI TRACKING: ANOMALY DETECTED", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.putText(frame, "TRAJECTORY: WRIST -> POCKET", (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        cv2.circle(frame, (width//2, height//2), 50, (0, 0, 255), 2) # Fake tracking circle
        
        out.write(frame)
        current_frame += 1
        
    cap.release()
    out.release()
    return True

def send_alert(clip_path):
    """
    Sends the POST request to the Django backend to show the alert on the UI.
    """
    print(f"🌐 Sending alert to UI with clip: {clip_path}")
    payload = {
        "anomaly_type": "TRAJECTORY",
        "confidence": 0.98,
        "rule_violated": "Hand moved from Counter Zone to Pocket Zone",
        "tier_source": "TRAJECTORY",
        "video_clip": clip_path,
        "details": json.dumps({"reason": "Hand moved from Counter Zone to Pocket Zone", "clip": clip_path, "note": "Anti-Gravity Demo"}),
    }
    try:
        r = requests.post(f"{BACKEND_URL}/alerts/", json=payload, timeout=5)
        if r.status_code == 201:
            print(f"✅ Alert successfully posted to Dashboard! ID: {r.json().get('id')}")
        else:
            print(f"⚠ Alert POST failed. Status code: {r.status_code}, Response: {r.text}")
    except Exception as e:
        print(f"❌ Could not connect to backend: {e}")

def run_demo(video_path, theft_time):
    print(f"\n🚀 Initiating Sentinel GEC Anti-Gravity Demo...")
    print(f"🎬 Target Video: {video_path}")
    print(f"⏱️  Theft Event Timestamp: {theft_time} seconds\n")
    
    os.makedirs(BUFFER_DIR, exist_ok=True)
    
    # 1. Play the video normally up to the theft point to simulate real-time processing
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("❌ Cannot open video file. Check the path.")
        return
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0: fps = 30.0
    
    theft_frame = int(max(0, theft_time) * fps)
    current_frame = 0
    
    print("⏳ Scanning video stream. (Press 'q' in the video window to abort)")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of video reached before theft time.")
            break
            
        # Draw scanning UI
        annotated = frame.copy()
        cv2.putText(annotated, "STATUS: MONITORING [TIER 2 YOLOv8]", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(annotated, "BUFFER: 20s ROLLING", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        
        cv2.imshow("Sentinel GEC - Live Agent", annotated)
        
        # We wait according to the FPS to simulate real-time playback
        delay = int(1000 / fps)
        if cv2.waitKey(delay) & 0xFF == ord('q'):
            print("Demo aborted by user.")
            break
            
        current_frame += 1
        
        # When we hit the theft time, pause and trigger the "AI" extraction
        if current_frame >= theft_frame:
            print("\n🚨 ANOMALY DETECTED! 🚨")
            print("Trajectory Deviation: Wrist -> Pocket")
            print("Locking 10-second buffer loop...")
            
            # Show the anomaly frame for a brief moment for dramatic effect
            cv2.putText(frame, "🚨 POCKETING DETECTED 🚨", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)
            cv2.imshow("Sentinel GEC - Live Agent", frame)
            cv2.waitKey(1500) # Pause for 1.5 seconds for effect
            
            cap.release()
            cv2.destroyAllWindows()
            
            # Generate the 10-second buffer (5s before, 5s after)
            buffer_start = max(0, theft_time - 5)
            clip_name = f"evidence_{int(time.time())}.avi"
            clip_path = os.path.join(BUFFER_DIR, clip_name)
            
            success = extract_clip(video_path, buffer_start, duration=10, output_path=clip_path)
            
            if success:
                print(f"✅ Buffer extracted successfully: {clip_path}")
                print("Anchoring to Hash-Queue and sending to UI...")
                # Alert UI
                # Notice the ./ to match exactly how the UI resolves paths in the Django static files usually,
                # or just pass the relative path
                send_alert(f"./{clip_path}")
                print("\n🎉 Demo execution complete. Check your Admin Dashboard!")
                
                print("\n" + "="*50)
                print("🧾 GENERATED ANOMALY REPORT (JSON)")
                print("="*50)
                
                today = time.strftime("%Y-%m-%d")
                
                output_data = [                  {
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
                print(json.dumps(output_data, indent=2))
                print("="*50 + "\n")
                
            break
            
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Anti-Gravity Demo Script for Sentinel GEC")
    parser.add_argument("video", type=str, help="Path to input video file (e.g. test_video.mp4)")
    parser.add_argument("--time", type=float, required=True, help="Exact second of the theft (e.g. 5.5)")
    args = parser.parse_args()
    
    run_demo(args.video, args.time)
