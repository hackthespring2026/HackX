import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from fastapi import Request
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio
# ==================== Configuration ====================
DB_FILE = "db.json"
DEFAULT_ADMIN_USER = {
    "id": "admin-001",
    "username": "admin",
    "password": "admin123",
    "role": "admin"
}

# ==================== Pydantic Models ====================
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    status: str
    role: str
    user_id: str

class User(BaseModel):
    username: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str

class LogEntry(BaseModel):
    action: str
    user_id: str
    transaction_amount: float = 0.0

class LogResponse(BaseModel):
    id: str
    action: str
    user_id: str
    transaction_amount: float
    timestamp: str

class AnalyticsResponse(BaseModel):
    time_interval: str
    total_amount: float
    transaction_count: int
    employee_id: str

class Alert(BaseModel):
    alert_type: str
    message: str
# ==================== FastAPI App ====================
app = FastAPI(title="POS Anomaly Detection System", version="1.0.0")

# ==================== CORS Middleware ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Local frontend during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Helper Functions ====================

def initialize_db():
    """Initialize the db.json file with default admin user if it doesn't exist."""
    if not os.path.exists(DB_FILE):
        db_data = {
            "users": [DEFAULT_ADMIN_USER],
            "pos_logs": []
        }
        with open(DB_FILE, "w") as f:
            json.dump(db_data, f, indent=2)
        print(f"✓ Database initialized: {DB_FILE}")

def read_db() -> dict:
    """Safely read the db.json file."""
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        initialize_db()
        return read_db()
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database file is corrupted"
        )

def write_db(data: dict):
    """Safely write data to db.json file."""
    try:
        with open(DB_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except IOError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write to database: {str(e)}"
        )

def generate_user_id() -> str:
    """Generate a unique user ID."""
    return str(uuid.uuid4())[:8].upper()

def generate_log_id() -> str:
    """Generate a unique log ID."""
    return str(uuid.uuid4())[:12].upper()

# ==================== API Routes ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    initialize_db()

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "POS Anomaly Detection System",
        "version": "1.0.0"
    }

@app.post("/login", response_model=LoginResponse, tags=["Authentication"])
def login(credentials: LoginRequest):
    """
    Authenticate user with username and password.
    
    Returns:
        - status: "success" or "failure"
        - role: user's role
        - user_id: user's ID
    """
    db = read_db()
    
    # Find user by username and password
    for user in db.get("users", []):
        if user["username"] == credentials.username and user["password"] == credentials.password:
            return LoginResponse(
                status="success",
                role=user["role"],
                user_id=user["id"]
            )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

@app.get("/users", response_model=List[UserResponse], tags=["Users"])
def get_users():
    """
    Retrieve all users from the database.
    
    Returns:
        List of users with id, username, and role (excluding passwords)
    """
    db = read_db()
    users = db.get("users", [])
    
    # Return users without passwords
    return [
        UserResponse(id=user["id"], username=user["username"], role=user["role"])
        for user in users
    ]

@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
def create_user(user: User):
    """
    Create a new user in the database.
    
    Args:
        - username: User's username
        - password: User's password
        - role: User's role (e.g., 'admin', 'operator', 'viewer')
    
    Returns:
        The created user with auto-generated ID
    """
    db = read_db()
    
    # Check if username already exists
    for existing_user in db.get("users", []):
        if existing_user["username"] == user.username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with username '{user.username}' already exists"
            )
    
    # Create new user with generated ID
    new_user = {
        "id": generate_user_id(),
        "username": user.username,
        "password": user.password,
        "role": user.role
    }
    
    # Append to users list and save
    db["users"].append(new_user)
    write_db(db)
    
    return UserResponse(
        id=new_user["id"],
        username=new_user["username"],
        role=new_user["role"]
    )

@app.get("/logs", response_model=List[LogResponse], tags=["Logs"])
def get_logs():
    """
    Retrieve all POS logs from the database.
    
    Returns:
        List of log entries with id, action, user_id, and timestamp
    """
    db = read_db()
    logs = db.get("pos_logs", [])
    return logs

@app.post("/logs", response_model=LogResponse, status_code=status.HTTP_201_CREATED, tags=["Logs"])
def create_log(log_entry: LogEntry):
    """
    Create a new log entry in the POS logs.
    
    Args:
        - action: The action performed (e.g., 'sale', 'refund', 'inventory_check')
        - user_id: The ID of the user who performed the action
        - transaction_amount: The amount of the transaction (optional)
    
    Returns:
        The created log entry with timestamp and auto-generated ID
    """
    db = read_db()
    
    # Verify user exists
    user_found = False
    for user in db.get("users", []):
        if user["id"] == log_entry.user_id:
            user_found = True
            break
    
    if not user_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{log_entry.user_id}' not found"
        )
    
    # Create new log entry with timestamp
    new_log = {
        "id": generate_log_id(),
        "action": log_entry.action,
        "user_id": log_entry.user_id,
        "transaction_amount": log_entry.transaction_amount,
        "timestamp": datetime.now().isoformat()
    }
    
    # Append to logs list and save
    db["pos_logs"].append(new_log)
    write_db(db)
    
    return LogResponse(
        id=new_log["id"],
        action=new_log["action"],
        user_id=new_log["user_id"],
        transaction_amount=new_log["transaction_amount"],
        timestamp=new_log["timestamp"]
    )

@app.get("/analytics", tags=["Analytics"])
def get_analytics(user_id: Optional[str] = None):
    """
    Get aggregated sales analytics grouped by 30-minute intervals.
    
    Args:
        - user_id: Optional filter by specific employee
    
    Returns:
        List of analytics data aggregated by 30-minute intervals for the current day
    """
    from collections import defaultdict
    from datetime import timedelta
    
    db = read_db()
    logs = db.get("pos_logs", [])
    
    # Get current date
    today = datetime.now().date()
    
    # Filter logs for today and by user if specified
    today_logs = []
    for log in logs:
        try:
            log_time = datetime.fromisoformat(log["timestamp"]).date()
            if log_time == today:
                if user_id is None or log["user_id"] == user_id:
                    today_logs.append(log)
        except (ValueError, KeyError):
            continue
    
    # Group logs by 30-minute intervals
    intervals = defaultdict(lambda: {"total_amount": 0.0, "count": 0, "employees": set()})
    
    for log in today_logs:
        try:
            log_time = datetime.fromisoformat(log["timestamp"])
            # Round to nearest 30-minute interval
            rounded_time = log_time.replace(minute=(log_time.minute // 30) * 30, second=0, microsecond=0)
            time_key = rounded_time.isoformat()
            
            intervals[time_key]["total_amount"] += log.get("transaction_amount", 0.0)
            intervals[time_key]["count"] += 1
            intervals[time_key]["employees"].add(log["user_id"])
        except (ValueError, KeyError):
            continue
    
    # Format response
    result = []
    for time_interval in sorted(intervals.keys()):
        data = intervals[time_interval]
        result.append({
            "time_interval": time_interval,
            "total_amount": round(data["total_amount"], 2),
            "transaction_count": data["count"],
            "employees": list(data["employees"])
        })
    
    return result

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "connected"}

# ==================== Error Handlers ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler."""
    # ✅ FIX: This is now a proper JSONResponse instead of a raw dictionary
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )
# ==================== ALERTS LOGIC ====================

@app.post("/alerts", tags=["Alerts"])
def create_alert(alert: Alert):
    from datetime import datetime
    db = read_db()
    
    # Create an alerts list if it doesn't exist yet
    if "alerts" not in db:
        db["alerts"] = []
        
    new_alert = {
        "id": generate_log_id(),
        "type": alert.alert_type,
        "message": alert.message,
        "timestamp": datetime.now().isoformat()
    }
    
    # Insert at the beginning of the list (newest first)
    db["alerts"].insert(0, new_alert)
    db["alerts"] = db["alerts"][:20]  # Keep only the last 20
    write_db(db)
    
    return {"status": "success", "alert": new_alert}

@app.get("/alerts", tags=["Alerts"])
def get_alerts():
    db = read_db()
    return db.get("alerts", [])
# ==================== VIDEO STREAMING LOGIC ====================

latest_frame = b""

@app.post("/upload_frame")
async def upload_frame(request: Request):
    global latest_frame
    latest_frame = await request.body()
    return {"status": "success"}

async def frame_generator():
    global latest_frame
    while True:
        if latest_frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame + b'\r\n')
        await asyncio.sleep(0.1)

@app.get("/video_feed")
async def video_feed():
    if not latest_frame:
        # Prevent crash if laptop hasn't sent a frame yet
        return JSONResponse(status_code=404, content={"message": "Waiting for drone feed..."})
        
    return StreamingResponse(
        frame_generator(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
# ==================== ESP8266 HARDWARE TRIGGER ====================
@app.get("/esp_alert", tags=["Alerts"])
def esp_alert():
    """Endpoint for ESP8266 to trigger a bank-style theft alert via simple GET request."""
    from datetime import datetime
    db = read_db()
    
    if "alerts" not in db:
        db["alerts"] = []
        
    new_alert = {
        "id": generate_log_id(),
        "type": "critical_hardware",
        "message": "🚨 CRITICAL: HARDWARE PANIC BUTTON TRIGGERED! EXTERNAL THEFT DETECTED!",
        "timestamp": datetime.now().isoformat()
    }
    
    db["alerts"].insert(0, new_alert)
    db["alerts"] = db["alerts"][:20] 
    write_db(db)
    
    return {"status": "success", "message": "Hardware Panic Alert Logged"}

# ==================== CAMERA 2 LOGIC ====================
latest_frame_2 = b""

@app.post("/upload_frame_2")
async def upload_frame_2(request: Request):
    global latest_frame_2
    latest_frame_2 = await request.body()
    return {"status": "success"}

async def frame_generator_2():
    global latest_frame_2
    while True:
        if latest_frame_2:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame_2 + b'\r\n')
        await asyncio.sleep(0.1)

@app.get("/video_feed_2")
async def video_feed_2():
    if not latest_frame_2:
        return JSONResponse(status_code=404, content={"message": "Waiting for Camera 2..."})
    return StreamingResponse(frame_generator_2(), media_type="multipart/x-mixed-replace; boundary=frame")

# ==================== CAMERA 3 LOGIC (NOTE DETECTION) ====================
latest_frame_3 = b""

@app.post("/upload_frame_3")
async def upload_frame_3(request: Request):
    global latest_frame_3
    latest_frame_3 = await request.body()
    return {"status": "success"}

async def frame_generator_3():
    global latest_frame_3
    while True:
        if latest_frame_3:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + latest_frame_3 + b'\r\n')
        await asyncio.sleep(0.1)

@app.get("/video_feed_3")
async def video_feed_3():
    if not latest_frame_3:
        return JSONResponse(status_code=404, content={"message": "Waiting for Camera 3..."})
    return StreamingResponse(frame_generator_3(), media_type="multipart/x-mixed-replace; boundary=frame")

# ==================== CASHIER STATUS LOGIC ====================
current_cashier_status = "SCANNING..."

@app.post("/set_cashier_status")
async def set_cashier_status(request: Request):
    global current_cashier_status
    data = await request.json()
    current_cashier_status = data.get("status", "SCANNING...")
    return {"status": "success"}

@app.get("/get_cashier_status")
def get_cashier_status():
    return {"status": current_cashier_status}
# ==================== LAUNCH ====================

if __name__ == "__main__":
    import uvicorn
    initialize_db()
    uvicorn.run(app, host="0.0.0.0", port=8000)