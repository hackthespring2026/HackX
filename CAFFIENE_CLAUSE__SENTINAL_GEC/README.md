# Sentinel GEC — Advanced 3-Tier AI Theft Prevention

Sentinel GEC is a live, automated ecosystem designed to prevent internal retail shrinkage (sweet-hearting, pocketing) through a **Camera-Agnostic, 3-Tier Security Architecture**. Unlike standard AI monitors, Sentinel relies on **Cross-Engine Verification** — merging POS system logic with live video AI scanning, backed immutably by the Sepolia Blockchain.

## 🚀 The 3-Tier Architecture
1. **Tier 1: Intelligent POS Logic (Django Backend)**
   The backend continuously evaluates POS logs against temporal logic rules. E.g., if a drawer is opened physically but no sale occurred in the last 8 seconds (`DRAWER_NO_SALE`), Tier 1 instantly fires an anomaly.
2. **Tier 2: YOLOv8 Computer Vision (AI Live Agent)**
   When a Tier 1 logical anomaly triggers, the `live_vision_agent.py` script intercepts it instantly and pulls a targeted buffer from the CCTV video stream. It runs YOLOv8 trajectory mapping (e.g., *Wrist → Pocket*) to confidently verify theft and generates an AI JSON report.
3. **Tier 3: Distributed IoT & Blockchain Verification**
   CCTV clips and JSON intelligence strings are sent back to the dashboard, and a unique cryptographic hash is anchored to the **Sepolia Testnet** via Ethereum smart contracts to ensure tampering of evidence is completely impossible.

## 🛠️ Tech Stack
- **Frontend:** HTML5, JS, CSS3, Petpooja UI Clone
- **Backend:** Django Rest Framework, SQLite
- **AI / Computer Vision:** Python, OpenCV, Ultralytics YOLOv8
- **Blockchain:** Web3.py, Sepolia Ethereum, Solidity

---

## 💻 Running the End-to-End Demo (Judge Evaluation)

### 1. Installation
Clone the repository, switch to the project directory, and install requirements:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the Sentinel Backend
Launch the Django server and open the dashboards:
```bash
chmod +x start_demo.sh
./start_demo.sh
```
*This script automatically runs Django migrations, starts the server on `localhost:8000`, and starts the background `ai_monitor.py` sensor.*

### 3. Start the Live Vision Agent (Tier 2 Magic)
Open a **new** terminal window, activate your `venv`, and start the AI scanner targeted at your CCTV footage:
```bash
python live_vision_agent.py "sample_footage.mp4" --time 5.5
```
*(Replace `sample_footage.mp4` with an actual video file). It will now wait in standby mode, polling for POS logical triggers.*

### 4. Trigger the Cross-Verified Anomaly!
1. Open the **Cashier POS UI** (`/cashier-frontend/cashier-pos v2.html`).
2. Click the **"🔓 No-Sale"** button and then **"Open Drawer"** to simulate unauthorized drawer access.
3. Automatically, the terminal running `live_vision_agent.py` will intercept the `DRAWER_NO_SALE` alert.
4. The YOLO scanner window will appear, scan the video, cut a 10-second evidentiary clip, and upload a `TRAJECTORY` AI physical anomaly alert.
5. Check your **Admin Dashboard**, and you will see the new critical AI JSON Report dynamically rendered in the UI with the blockchain verification hash.

---
**Hackathon Submission folder structure fully optimized. Run your tests flawlessly.**
