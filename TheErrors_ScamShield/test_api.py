import requests
import time
import sys

BASE_URL = "http://localhost:8000"
VIDEO_PATH = "test_video_1.mp4"

def test_pipeline():
    print(f"Uploading {VIDEO_PATH}...")
    with open(VIDEO_PATH, 'rb') as f:
        files = {'file': f}
        upload_res = requests.post(f"{BASE_URL}/api/upload", files=files)
        
    if upload_res.status_code != 200:
        print(f"Upload failed: {upload_res.text}")
        return
        
    data = upload_res.json()
    file_id = data['file_id']
    print(f"Uploaded successfully. File ID: {file_id}")
    
    print("Triggering processing...")
    process_res = requests.post(f"{BASE_URL}/api/process/{file_id}")
    if process_res.status_code != 200:
        print(f"Process trigger failed: {process_res.text}")
        return
        
    print("Polling status...")
    while True:
        status_res = requests.get(f"{BASE_URL}/api/status/{file_id}")
        status_data = status_res.json()
        status = status_data['status']
        print(f"Current status: {status}")
        
        if status == 'completed':
            print("Processing completed successfully!")
            break
        elif status.startswith('failed'):
            print(f"Processing failed: {status}")
            sys.exit(1)
            
        time.sleep(2)
        
    print("Verifying video URL...")
    video_res = requests.get(f"{BASE_URL}/api/video/{file_id}")
    if video_res.status_code == 200:
        print("Video is accessible!")
    else:
        print("Failed to access video output.")
        sys.exit(1)

if __name__ == "__main__":
    test_pipeline()
