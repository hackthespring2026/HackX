import os
import shutil
import uuid
from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from detector import process_video
import glob

app = FastAPI(title="Thief Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
ALERTS_DIR = "alerts"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ALERTS_DIR, exist_ok=True)

class ProcessingStatus:
    def __init__(self):
        self.status = {}

processing_status = ProcessingStatus()

def process_video_task(file_id: str, input_path: str, output_path: str):
    processing_status.status[file_id] = "processing"
    try:
        process_video(input_path, output_path)
        processing_status.status[file_id] = "completed"
    except Exception as e:
        processing_status.status[file_id] = f"failed: {str(e)}"
        print(f"Error processing {file_id}: {e}")

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    
    if not ext:
        ext = ".mp4"
        
    input_filename = f"{file_id}{ext}"
    input_path = os.path.join(UPLOAD_DIR, input_filename)
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"file_id": file_id, "filename": file.filename, "message": "Video uploaded successfully"}

@app.post("/api/process/{file_id}")
async def start_processing(file_id: str, background_tasks: BackgroundTasks):
    input_path = None
    for f in os.listdir(UPLOAD_DIR):
        if f.startswith(file_id):
            input_path = os.path.join(UPLOAD_DIR, f)
            break
            
    if not input_path:
        return {"error": "File not found"}
        
    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_output.mp4")
    
    background_tasks.add_task(process_video_task, file_id, input_path, output_path)
    return {"message": "Processing started", "file_id": file_id}

@app.get("/api/status/{file_id}")
async def get_status(file_id: str):
    # Returns status string: unknown, processing, completed, or failed message
    return {"status": processing_status.status.get(file_id, "unknown")}

@app.get("/api/video/{file_id}")
async def get_video(file_id: str):
    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_output.mp4")
    if os.path.exists(output_path):
        return FileResponse(output_path, media_type="video/mp4")
    return {"error": "Video not found or processing not complete"}

@app.get("/api/alerts")
async def get_alerts():
    alert_files = glob.glob(os.path.join(ALERTS_DIR, "*.jpg"))
    alert_files.sort(reverse=True)
    
    alerts = []
    for filepath in alert_files:
        filename = os.path.basename(filepath)
        alerts.append({
            "id": filename,
            "filename": filename,
            "url": f"/api/alerts/{filename}"
        })
        
    return {"alerts": alerts}

@app.get("/api/alerts/{filename}")
async def get_alert_image(filename: str):
    file_path = os.path.join(ALERTS_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg")
    return {"error": "Image not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
