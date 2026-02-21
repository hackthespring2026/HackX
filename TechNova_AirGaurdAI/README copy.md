# 🌿 AirGuard – Smart Air Pollution Monitoring & Health Alert System

> **Hackathon-Ready AI-Powered Air Quality Platform**

A real-time global AI system that monitors air pollution, predicts future trends,
provides personalized health alerts, suggests safe routes, and acts as a smart guardian
for public health and urban planning.

---

## 🚀 Quick Start (Get Running in 5 Minutes)

### Step 1 – Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

**Demo Login:** demo@airguard.ai / demo123

### Step 2 – Backend (Optional for full features)
```bash
cd backend
npm install
cp .env.example .env   # edit your tokens
npm run dev
```

### Step 3 – ML Service (Optional)
```bash
cd ml-model
pip install -r requirements.txt
python scripts/train.py    # train models
python api_server.py       # start ML API
```

---

## 📁 Project Structure

```
AirGuard/
├── frontend/                  # React + Vite + Tailwind
│   └── src/
│       ├── pages/             # 9 feature pages
│       ├── components/        # Reusable UI components
│       └── utils/api.js       # WAQI + backend API calls
│
├── backend/                   # Node.js + Express
│   ├── controllers/           # Business logic
│   ├── routes/                # API endpoints
│   ├── models/                # MongoDB schemas
│   └── utils/                 # JWT middleware
│
└── ml-model/                  # Python ML
    ├── scripts/train.py       # Model training
    ├── api_server.py          # Flask prediction API
    ├── models/                # Saved .pkl files
    └── data/                  # Training datasets
```

---

## 🌐 Pages & Features

| Page | Description |
|------|-------------|
| **Landing** | Impactful hero with stats counter, feature showcase |
| **Global AQI Map** | Live Leaflet map with WAQI data, city search |
| **City Analysis** | 7-day trends, zone classification, health risk estimation |
| **Health Risk AI** | Personalized risk score based on your health profile |
| **Safe Routes** | Compare routes by pollution exposure level |
| **Future Simulator** | 5-year AI forecast with scenario selection |
| **Tree Advisor** | AI plantation recommendations by zone |
| **School Safety** | Monitor AQI near schools, activity recommendations |
| **Clean Air Challenge** | Gamification with points, leaderboard, levels |

---

## 🔑 API Keys Needed

### WAQI (Free – Highly Recommended)
1. Visit: https://aqicn.org/api/
2. Register for a **free token** (no credit card)
3. Add to `frontend/src/utils/api.js`:
   ```js
   export const WAQI_TOKEN = "your_token_here";
   ```
4. Add to `backend/.env`:
   ```
   WAQI_TOKEN=your_token_here
   ```

### Demo Mode
The app works with `WAQI_TOKEN = "demo"` for testing. The demo token has rate limits.

---

## 🤖 AI/ML Models

### 1. Random Forest (AQI Prediction)
- **Input:** PM2.5, PM10, NO₂, SO₂, CO, O₃, temperature, humidity, wind speed, traffic
- **Output:** Predicted AQI value
- **Accuracy:** MAE ≈ 8-12 AQI points

### 2. Linear Regression (5-Year Forecast)
- **Input:** Historical AQI + time index
- **Output:** Future AQI trend line

### 3. K-Means Clustering (Zone Classification)
- **Input:** Pollution + traffic features
- **Output:** Safe / Moderate / Danger zone

### Training
```bash
cd ml-model
python scripts/train.py
```

### Retraining with New Data
1. Add rows to `ml-model/data/sample_data.csv`
2. Run `python scripts/train.py`
3. New `.pkl` files replace old ones automatically

---

## 📡 Backend API Endpoints

```
POST /api/auth/register     – Create account
POST /api/auth/login        – Login

GET  /api/aqi/city/:name    – Get city AQI (via WAQI)
GET  /api/aqi/geo/:lat/:lng – Get AQI by coordinates

POST /api/health/risk       – Calculate health risk score
POST /api/health/profile    – Save user health profile

POST /api/predict           – AQI prediction / forecast

POST /api/challenge/update  – Add challenge points
GET  /api/challenge/leaderboard – Get leaderboard
```

---

## 🎨 UI Design System

- **Theme:** Dark navy (#020817) with blue/green accents
- **Glassmorphism:** `glass-card` class with blur backdrop
- **Fonts:** Syne (headings) + DM Sans (body) + JetBrains Mono (data)
- **AQI Colors:**
  - 🟢 0–50 Good `#22c55e`
  - 🟡 51–100 Moderate `#eab308`
  - 🟠 101–150 Unhealthy for Sensitive `#f97316`
  - 🔴 151–200 Unhealthy `#ef4444`
  - 🟣 201–300 Very Unhealthy `#a855f7`

---

## 🏗️ Deployment

### Vercel (Frontend)
```bash
cd frontend
npm run build
# Upload dist/ to Vercel
```

### Railway / Render (Backend)
```bash
# Set environment variables in dashboard
# Deploy from GitHub
```

---

## 📊 Health Risk Score Formula

```
Score = AQI_base + Age_factor + Conditions + Exposure
```

- AQI ≤50 → +10 pts | AQI ≤100 → +30 | AQI >200 → +90
- Age < 5 or > 65 → +20 pts
- Asthma → +20 pts | Heart → +25 pts
- Outdoor hours × 5 pts each

**Output → Mask type, safe duration, best time outside**

---

## 🌳 Tree Impact Calculator

- 1 tree absorbs ~22 kg CO₂/year
- 500 trees ≈ 0.5% AQI reduction
- Best species: Neem, Peepal, Bamboo

---

## 👥 Team / Credits

Built with ❤️ for the hackathon using:
- WAQI API for real air quality data
- Leaflet.js for interactive maps
- Recharts for data visualization
- Scikit-learn for ML models
