# 🌿 EcoTwin AI – Backend

Node.js / Express REST API + WebSocket server for the EcoTwin AI Industrial Emission Intelligence platform.

---

## 📁 Project Structure

```
ecotwin-backend/
├── src/
│   ├── server.js              ← Entry point (HTTP + WebSocket)
│   ├── app.js                 ← Express config, middleware, route mounts
│   ├── config/
│   │   ├── db.js              ← MongoDB connection
│   │   └── websocket.js       ← WebSocket server (real-time IoT streaming)
│   ├── models/
│   │   ├── User.js            ← Auth users with role-based access
│   │   ├── Company.js         ← Company setup (equipment, thresholds, contacts)
│   │   ├── Device.js          ← IoT device registry
│   │   ├── DeviceReading.js   ← Time-series emission readings (auto-expires 90d)
│   │   ├── Alert.js           ← Threshold breach alerts
│   │   ├── Notification.js    ← Bell panel notifications
│   │   └── CarbonCredit.js    ← Carbon credit records
│   ├── controllers/
│   │   ├── auth.controller.js         ← Register / Login / JWT
│   │   ├── device.controller.js       ← IoT data ingestion (POST /api/device-data)
│   │   ├── emission.controller.js     ← Chart data, history, summary KPIs
│   │   ├── dashboard.controller.js    ← Live dashboard stats
│   │   ├── alert.controller.js        ← Alert management
│   │   ├── report.controller.js       ← Compliance report generation
│   │   ├── company.controller.js      ← Company setup form
│   │   └── notification.controller.js ← Notification bell
│   ├── routes/                ← One file per feature
│   └── middleware/
│       ├── auth.js            ← JWT protect + role authorise guards
│       └── errorHandler.js    ← Global error handler
├── .env                       ← Environment variables
└── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 2. Install dependencies
```bash
cd ecotwin-backend
npm install
```

### 3. Configure environment
Edit `.env` – at minimum set your `MONGO_URI`:
```env
MONGO_URI=mongodb://localhost:27017/ecotwin
JWT_SECRET=change_this_to_a_long_random_string
```

### 4. Run in development
```bash
npm run dev        # uses nodemon for auto-restart
```

### 5. Run in production
```bash
npm start
```

Server starts on **http://localhost:5000**

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register user + company |
| POST | `/api/auth/login` | ✗ | Login → returns JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| PUT | `/api/auth/update-profile` | ✓ | Update name/role |
| PUT | `/api/auth/change-password` | ✓ | Change password |

### IoT Device Data
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **POST** | **`/api/device-data`** | ✗ | **IoT sensor ingestion** (auto-registers new devices) |
| GET | `/api/device-data` | ✓ | List all devices |
| GET | `/api/device-data/:deviceId` | ✓ | Single device detail |
| PUT | `/api/device-data/:deviceId/threshold` | ✓ | Update threshold |
| DELETE | `/api/device-data/:deviceId` | Admin | Remove device |

### Emissions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/emissions` | ✓ | Historical readings (filterable) |
| GET | `/api/emissions/chart?hours=24` | ✓ | Chart-ready buckets |
| GET | `/api/emissions/summary` | ✓ | KPI totals + carbon credits |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard/stats` | ✓ | KPI snapshot |
| GET | `/api/dashboard/live-devices` | ✓ | 6 latest IoT cards |

### Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts` | ✓ | List alerts |
| PUT | `/api/alerts/:id/resolve` | ✓ | Resolve alert |
| PUT | `/api/alerts/:id/read` | ✓ | Mark read |
| DELETE | `/api/alerts/:id` | ✓ | Delete alert |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/generate?period=weekly` | ✓ | Generate compliance report |
| GET | `/api/reports/list` | ✓ | List saved reports |

### Company Setup
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/company` | ✓ | Get company profile |
| PUT | `/api/company` | Admin | Save full setup form |
| POST | `/api/company/equipment` | Admin | Add equipment unit |
| DELETE | `/api/company/equipment/:id` | Admin | Remove equipment |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | ✓ | Get bell notifications |
| PUT | `/api/notifications/read-all` | ✓ | Mark all read |
| DELETE | `/api/notifications/clear` | ✓ | Clear all |

---

## 📡 IoT Sensor Integration

Sensors POST to **`/api/device-data`** (no authentication required):

```json
POST http://localhost:5000/api/device-data
Content-Type: application/json

{
  "deviceId": "DEV-B42",
  "emission": 18.7,
  "timestamp": "2026-02-21T10:30:00.000Z",
  "type": "Boiler",
  "plant": "Plant 1 — Ahmedabad",
  "nox": 180,
  "sox": 320,
  "pm25": 45
}
```

New device IDs are **auto-registered** – no pre-configuration needed.

---

## 🔌 WebSocket (Real-Time)

Connect to `ws://localhost:5000` to receive live device updates:

```js
const ws = new WebSocket('ws://localhost:5000');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.type === 'DEVICE_UPDATE'
  // msg.payload === { deviceId, emission, status, ... }
};

// Subscribe to a specific device
ws.send(JSON.stringify({ type: 'SUBSCRIBE', deviceId: 'DEV-B42' }));
```

---

## 🔑 JWT Usage

Include the token from login in every protected request:

```
Authorization: Bearer <your_token>
```

---

## 🛡️ User Roles
| Role | Permissions |
|------|-------------|
| `admin` | Full access: company settings, delete devices |
| `operator` | View + update device thresholds |
| `sustainability` | View only (reports, emissions) |
