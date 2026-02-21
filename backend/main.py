from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import cv2
import asyncio
import json
import os
import shutil
import random
from vision_engine import TheftDetectionPipeline
from datetime import datetime
from pydantic import BaseModel
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException, status

app = FastAPI(title="RetailGuard AI - Vision Backend")

# Setup MongoDB Connection
MONGO_DETAILS = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_DETAILS)
db = client.retailguard
users_collection = db.get_collection("users")

import bcrypt

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

class UserAuth(BaseModel):
    username: str
    password: str

@app.post("/api/register")
async def register(user: UserAuth):
    existing_user = await users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(user.password)
    new_user = await users_collection.insert_one({
        "username": user.username,
        "password_hash": hashed_password
    })
    return {"message": "User registered successfully"}

@app.post("/api/login")
async def login(user: UserAuth):
    db_user = await users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Simple token for local dev
    token = f"{user.username}_auth_token_777"
    return {"message": "Login successful", "token": token, "username": user.username}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(data))
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/upload_video")
async def upload_video(file: UploadFile = File(...)):
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # Store the filename globally or in session (for single client demo, global is fine)
    app.state.current_video = file_location
    return {"status": "success", "filename": file_location}

def generate_frames():
    video_path = getattr(app.state, 'current_video', None)
    if not video_path or not os.path.exists(video_path):
        return

    # Create a fresh vision pipeline state for every new feed so demo states reset
    vision_pipeline = TheftDetectionPipeline('yolov8n.pt')
    cap = cv2.VideoCapture(video_path)
    last_alert_time = datetime.now()
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            # Loop the video for demo purposes when it ends
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
            
        processed_frame, is_theft, alert_message, pos_items = vision_pipeline.process_frame(frame)
        
        # Broadcast standard POS items found
        for item in pos_items:
            # Simulate a 1000 INR checkout to match the user's heist narrative
            # Sending 3 items that sum to exactly 1000 INR
            demo_items = [
                {"name": "Premium Basmati Rice 5kg", "price": 500.00, "code": "89012345"},
                {"name": "Organic Olive Oil 1L", "price": 300.00, "code": "89054321"},
                {"name": "Almond Milk 2L", "price": 200.00, "code": "89098765"}
            ]
            
            for demo_item in demo_items:
                try:
                    loop = asyncio.get_event_loop()
                    loop.create_task(manager.broadcast({
                        "type": "pos_log",
                        "item": demo_item["name"],
                        "price": demo_item["price"],
                        "code": demo_item["code"]
                    }))
                except Exception:
                    pass

        if is_theft and alert_message:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(manager.broadcast({
                    "type": "alert",
                    "level": "critical",
                    "message": alert_message,
                    "timestamp": datetime.now().strftime("%I:%M:%S %p")
                }))
            except Exception:
                pass
        
        # Encode to JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/api/video_feed")
async def video_feed():
    # MJPEG Streaming Response
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
