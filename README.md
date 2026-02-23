# SPARK.AI🥉


This is a complete Edge-to-Cloud multi-node security architecture designed for restaurant and retail surveillance. Instead of relying on heavy cloud computing, we used local laptops as "Edge AI Nodes" combined with custom ESP8266 hardware, all streaming to a centralized web dashboard. 



<img width="2752" height="1483" alt="FlowChart" src="https://github.com/user-attachments/assets/16345480-7aed-4e32-83d5-daf1533446c3" />



---

## 👨‍💻 Team Members
* **Nirmalya:** Cloud Architecture (Ubuntu Droplet, Nginx, PM2)
* **Pratibha:** Hardware Integration (ESP8266), System Integration & Strategy
* **Aadil:** Face Authentication AI Node
* **Aditi:** MediaPipe & Action Detection AI Node

---

## 🏗️ How We Designed the Architecture
I wanted to know exactly how the frontend and backend connected, so we built it completely from scratch using REST APIs and HTTP requests. Here is the complete detail of how it works:

### 1. The Backend (Python + FastAPI)
This is the "Traffic Cop" of the system. It ran on a DigitalOcean Ubuntu Droplet (managed with PM2 to keep it running forever, and Nginx as a reverse proxy).
* It sets up API endpoints to catch data from our local devices.
* It receives constant video frames from the AI nodes and serves them back out to the website using **Motion JPEG (MJPEG)** streaming.

### 2. The Frontend (React.js + Tailwind)
This is the Admin Dashboard. It is completely decoupled from the backend.
* It uses a `useEffect` hook to run a `setInterval` timer.
* Every 2 seconds, it sends a `fetch()` GET request to the backend asking, "Are there any new alerts?"
* If the backend sends back a JSON payload with an alert, React updates the UI state instantly.



### 3. The Edge Nodes (Local AI & Hardware)
These scripts run locally on our laptops to do the heavy processing. Once they detect something, they send a tiny JSON payload (like `{"status": "AUTHORIZED"}`) across the Wi-Fi to the server.
* **YOLO & Pose Node (stream.py):** Tracks overall store activity and unauthorized intrusion.
* **Face Auth Node:** Recognizes cashiers and sends status updates to lock/unlock the register UI.
* **Action Detection :** Uses MediaPipe to track hand movements and note handling at the cash counter.
* **ESP8266 Hardware Panic Button:** A physical C++ hardware interrupt that blasts an emergency HTTP request to the server.

---

## 💻 How to Run This Locally
Since we moved the files from the Droplet to a local Windows machine, you do not need a cloud server to run this. Just run it on your `localhost`.

### Step 1: Change the IPs
Before running, you must change the server IP in the edge node files from the old Droplet IP to your local IP (`127.0.0.1`):
1. In `AdminDashboard.jsx`: Change all fetch URLs to `http://127.0.0.1:8000/...`
2. In the AI python files (`stream.py`, `aadil_main.py`, `note_detection.py`): Change the target URL variables to `http://127.0.0.1:8000/...`

### Step 2: Start the Backend (FastAPI)
Open a terminal in the backend folder and run:
```bash
# Create a virtual environment so packages don't conflict
python -m venv venv
venv\Scripts\activate

# Install requirements
pip install fastapi uvicorn requests opencv-python

# Run the server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
### Step 3: Start the Frontend (React Dashboard)
Open a second terminal in the `Dashboard` folder:

```bash
# Install the Node packages (This is why we need npm!)
npm install

# Start the React development server
npm run dev
```
### Step 4: Start the Edge Nodes

Open a new terminal for each AI script you want to run, activate your Python environment, and simply run python stream.py (or the respective filename). The video will immediately start streaming to the React dashboard!


It looks perfect. It completely captures your hands-on approach and gives anyone reading it exactly what they need to know to get the system running locally. 

I would absolutely love to help you draft that LinkedIn post! Would you prefer the post to foc
