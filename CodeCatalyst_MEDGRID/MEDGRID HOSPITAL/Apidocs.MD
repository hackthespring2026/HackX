# MEDGRID Hospital – API Reference

Base URL: `http://localhost:3000/api`

---

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Summary: beds, active emergencies, latest alert |

### Sample Response
```json
{
  "success": true,
  "data": {
    "beds": { "total": 120, "available": 32, "icu": 5, "oxygenStatus": "Available" },
    "activeEmergencies": 1,
    "latestEmergency": { "id": "e-001", "description": "Accident Case", "distanceKm": 2.3, "etaMinutes": 7, "status": "Pending" },
    "ambulancesEnRoute": 1,
    "hospital": "City Care Hospital"
  }
}
```

---

## Beds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beds` | Get bed inventory |
| PUT | `/api/beds` | Update bed counts / oxygen status |

### PUT /api/beds — Body
```json
{ "total": 120, "available": 30, "icu": 4, "oxygenStatus": "Low" }
```

---

## Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List all patients |
| GET | `/api/patients/:id` | Get one patient |
| POST | `/api/patients` | Add pre-admission patient |
| PUT | `/api/patients/:id` | Update patient info |
| DELETE | `/api/patients/:id` | Remove patient |
| POST | `/api/patients/:id/admit` | Generate admission form & mark Admitted |

### POST /api/patients — Body
```json
{
  "name": "Rahul Mehta",
  "age": 35,
  "phone": "9876543210",
  "allergies": "Penicillin",
  "insurance": "HDFC Ergo",
  "insuranceNo": "HD#12345"
}
```

### POST /api/patients/:id/admit — Response
```json
{
  "success": true,
  "data": {
    "admissionForm": {
      "patientId": "p-001",
      "name": "Nirav Chaudhari",
      "admittedAt": "2025-06-01T09:30:00.000Z",
      "hospital": "City Care Hospital"
    }
  }
}
```

---

## Emergencies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emergencies` | All emergencies |
| GET | `/api/emergencies/active` | Only Pending emergencies |
| POST | `/api/emergencies` | Create new emergency alert |
| PATCH | `/api/emergencies/:id/accept` | Accept emergency |
| PATCH | `/api/emergencies/:id/reject` | Reject emergency |

### POST /api/emergencies — Body
```json
{ "description": "Fire accident on highway", "distanceKm": 4.1, "etaMinutes": 12 }
```

---

## Ambulances

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ambulances` | List all ambulances |
| GET | `/api/ambulances/:id` | Get one ambulance |
| POST | `/api/ambulances` | Register new ambulance |
| PUT | `/api/ambulances/:id/location` | Update GPS + ETA (called from ambulance app) |

### PUT /api/ambulances/:id/location — Body
```json
{ "lat": 19.082, "lng": 72.877, "etaMinutes": 3, "status": "En Route" }
```

---

## Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get hospital settings |
| PUT | `/api/settings` | Update hospital name / emergency contact |

### PUT /api/settings — Body
```json
{ "hospitalName": "MEDGRID Hospital", "emergencyContact": "9876543210" }
```

---

## How to Connect Your Frontend

Add this JS snippet to each HTML page to call the API instead of using static data:

```js
const API = 'http://localhost:3000/api';

// Dashboard
const res  = await fetch(`${API}/dashboard`);
const data = await res.json();
console.log(data.data.beds.available);   // 32

// Accept emergency
await fetch(`${API}/emergencies/e-001/accept`, { method: 'PATCH' });

// Update beds
await fetch(`${API}/beds`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ available: 28, oxygenStatus: 'Low' })
});
```

---

## Folder Structure

```
medgrid-backend/
├── server.js        ← main backend (this file)
├── package.json
├── API_DOCS.md      ← this file
└── public/          ← put your HTML + style.css here
    ├── dashboard.html
    ├── bed-management.html
    ├── patients.html
    ├── ambulance-tracking.html
    ├── settings.html
    └── style.css
```

## Quick Start

```bash
npm install
node server.js
# → http://localhost:3000
```