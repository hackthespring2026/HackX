/**
 * MEDGRID Hospital Backend
 * Node.js + Express REST API
 * 
 * Run:  npm install  →  node server.js
 * API base: http://localhost:3000/api
 */

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Serve the frontend HTML/CSS files from a "public" folder ────────────────
// Copy your HTML + style.css into the "public/" directory next to server.js
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY DATA STORE  (replace with a real DB like MongoDB / PostgreSQL)
// ═════════════════════════════════════════════════════════════════════════════

const db = {

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    hospitalName:     'City Care Hospital',
    emergencyContact: '9876543210',
  },

  // ── Bed inventory ─────────────────────────────────────────────────────────
  beds: {
    total:        120,
    available:    32,
    icu:           5,
    oxygenStatus: 'Available',   // 'Available' | 'Low' | 'Critical'
  },

  // ── Patients (pre-admission) ───────────────────────────────────────────────
  patients: [
    {
      id:          'p-001',
      name:        'Nirav Chaudhari',
      age:         27,
      phone:       '9856656244',
      allergies:   'None',
      insurance:   'Star Health',
      insuranceNo: 'fy#76594',
      status:      'Pre-Admission',   // 'Pre-Admission' | 'Admitted' | 'Discharged'
      createdAt:   new Date().toISOString(),
    },
  ],

  // ── Emergency alerts ──────────────────────────────────────────────────────
  emergencies: [
    {
      id:          'e-001',
      description: 'Accident Case',
      distanceKm:  2.3,
      etaMinutes:  7,
      status:      'Pending',    // 'Pending' | 'Accepted' | 'Rejected'
      createdAt:   new Date().toISOString(),
    },
  ],

  // ── Ambulances ────────────────────────────────────────────────────────────
  ambulances: [
    {
      id:         'A12',
      status:     'En Route',   // 'Available' | 'En Route' | 'Returning'
      etaMinutes: 5,
      lat:        19.0760,
      lng:        72.8777,
      emergency:  'e-001',
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const ok   = (res, data)         => res.json({ success: true,  data });
const fail = (res, msg, code=400) => res.status(code).json({ success: false, error: msg });

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES — SETTINGS   /api/settings
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/settings
app.get('/api/settings', (req, res) => ok(res, db.settings));

// PUT /api/settings
app.put('/api/settings', (req, res) => {
  const { hospitalName, emergencyContact } = req.body;
  if (hospitalName)     db.settings.hospitalName     = hospitalName;
  if (emergencyContact) db.settings.emergencyContact = emergencyContact;
  ok(res, db.settings);
});

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES — BEDS   /api/beds
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/beds
app.get('/api/beds', (req, res) => ok(res, db.beds));

// PUT /api/beds
app.put('/api/beds', (req, res) => {
  const { total, available, icu, oxygenStatus } = req.body;
  if (total        !== undefined) db.beds.total        = Number(total);
  if (available    !== undefined) db.beds.available    = Number(available);
  if (icu          !== undefined) db.beds.icu          = Number(icu);
  if (oxygenStatus !== undefined) db.beds.oxygenStatus = oxygenStatus;
  ok(res, db.beds);
});

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES — PATIENTS   /api/patients
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/patients          → list all
// GET /api/patients/:id      → single patient
// POST /api/patients         → create
// PUT /api/patients/:id      → update
// DELETE /api/patients/:id   → delete

app.get('/api/patients', (req, res) => ok(res, db.patients));

app.get('/api/patients/:id', (req, res) => {
  const p = db.patients.find(p => p.id === req.params.id);
  if (!p) return fail(res, 'Patient not found', 404);
  ok(res, p);
});

app.post('/api/patients', (req, res) => {
  const { name, age, phone, allergies, insurance, insuranceNo } = req.body;
  if (!name || !phone) return fail(res, 'name and phone are required');
  const patient = {
    id: 'p-' + uuidv4().slice(0,6),
    name, age: Number(age), phone,
    allergies:   allergies   || 'None',
    insurance:   insurance   || '',
    insuranceNo: insuranceNo || '',
    status:    'Pre-Admission',
    createdAt: new Date().toISOString(),
  };
  db.patients.push(patient);
  res.status(201).json({ success: true, data: patient });
});

app.put('/api/patients/:id', (req, res) => {
  const p = db.patients.find(p => p.id === req.params.id);
  if (!p) return fail(res, 'Patient not found', 404);
  const fields = ['name','age','phone','allergies','insurance','insuranceNo','status'];
  fields.forEach(f => { if (req.body[f] !== undefined) p[f] = req.body[f]; });
  ok(res, p);
});

app.delete('/api/patients/:id', (req, res) => {
  const idx = db.patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) return fail(res, 'Patient not found', 404);
  db.patients.splice(idx, 1);
  ok(res, { deleted: req.params.id });
});

// POST /api/patients/:id/admit  → generate admission form (returns JSON summary)
app.post('/api/patients/:id/admit', (req, res) => {
  const p = db.patients.find(p => p.id === req.params.id);
  if (!p) return fail(res, 'Patient not found', 404);
  p.status = 'Admitted';
  ok(res, {
    admissionForm: {
      patientId:    p.id,
      name:         p.name,
      age:          p.age,
      phone:        p.phone,
      allergies:    p.allergies,
      insurance:    p.insurance,
      insuranceNo:  p.insuranceNo,
      admittedAt:   new Date().toISOString(),
      hospital:     db.settings.hospitalName,
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES — EMERGENCIES   /api/emergencies
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/emergencies
app.get('/api/emergencies', (req, res) => ok(res, db.emergencies));

// GET /api/emergencies/active  → only Pending ones
app.get('/api/emergencies/active', (req, res) => {
  ok(res, db.emergencies.filter(e => e.status === 'Pending'));
});

// POST /api/emergencies   → create new emergency (called by ambulance dispatch)
app.post('/api/emergencies', (req, res) => {
  const { description, distanceKm, etaMinutes } = req.body;
  if (!description) return fail(res, 'description is required');
  const e = {
    id:          'e-' + uuidv4().slice(0,6),
    description,
    distanceKm:  Number(distanceKm)  || 0,
    etaMinutes:  Number(etaMinutes)  || 0,
    status:      'Pending',
    createdAt:   new Date().toISOString(),
  };
  db.emergencies.push(e);
  res.status(201).json({ success: true, data: e });
});

// PATCH /api/emergencies/:id/accept
app.patch('/api/emergencies/:id/accept', (req, res) => {
  const e = db.emergencies.find(e => e.id === req.params.id);
  if (!e) return fail(res, 'Emergency not found', 404);
  e.status = 'Accepted';
  ok(res, e);
});

// PATCH /api/emergencies/:id/reject
app.patch('/api/emergencies/:id/reject', (req, res) => {
  const e = db.emergencies.find(e => e.id === req.params.id);
  if (!e) return fail(res, 'Emergency not found', 404);
  e.status = 'Rejected';
  ok(res, e);
});

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES — AMBULANCES   /api/ambulances
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/ambulances
app.get('/api/ambulances', (req, res) => ok(res, db.ambulances));

// GET /api/ambulances/:id
app.get('/api/ambulances/:id', (req, res) => {
  const a = db.ambulances.find(a => a.id === req.params.id);
  if (!a) return fail(res, 'Ambulance not found', 404);
  ok(res, a);
});

// POST /api/ambulances   → register new ambulance
app.post('/api/ambulances', (req, res) => {
  const { id, status, etaMinutes, lat, lng } = req.body;
  if (!id) return fail(res, 'id is required');
  const a = {
    id, status: status || 'Available',
    etaMinutes: Number(etaMinutes) || 0,
    lat: Number(lat) || 0,
    lng: Number(lng) || 0,
    emergency: null,
  };
  db.ambulances.push(a);
  res.status(201).json({ success: true, data: a });
});

// PUT /api/ambulances/:id/location  → update GPS position + ETA (called by ambulance app)
app.put('/api/ambulances/:id/location', (req, res) => {
  const a = db.ambulances.find(a => a.id === req.params.id);
  if (!a) return fail(res, 'Ambulance not found', 404);
  const { lat, lng, etaMinutes, status } = req.body;
  if (lat        !== undefined) a.lat        = Number(lat);
  if (lng        !== undefined) a.lng        = Number(lng);
  if (etaMinutes !== undefined) a.etaMinutes = Number(etaMinutes);
  if (status     !== undefined) a.status     = status;
  ok(res, a);
});

// ═════════════════════════════════════════════════════════════════════════════
// ROUTES — DASHBOARD SUMMARY   /api/dashboard
// ═════════════════════════════════════════════════════════════════════════════

app.get('/api/dashboard', (req, res) => {
  ok(res, {
    beds:             db.beds,
    activeEmergencies: db.emergencies.filter(e => e.status === 'Pending').length,
    latestEmergency:  db.emergencies.filter(e => e.status === 'Pending')[0] || null,
    ambulancesEnRoute: db.ambulances.filter(a => a.status === 'En Route').length,
    hospital:         db.settings.hospitalName,
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// START
// ═════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏥  MEDGRID backend running → http://localhost:${PORT}`);
  console.log(`📡  API base              → http://localhost:${PORT}/api\n`);
});