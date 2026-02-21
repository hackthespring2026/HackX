/**
 * MEDGRID Frontend ↔ Backend Integration
 * Include this script in each HTML page:
 *   <script src="api.js"></script>
 *
 * It auto-detects which page is active and wires up live data + form submissions.
 */

const API = 'http://localhost:3000/api';

// ─── Utility ─────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return await res.json();
  } catch (err) {
    console.error('API error:', err);
    return { success: false, error: err.message };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════════════════════
async function initDashboard() {
  const r = await apiFetch('/dashboard');
  if (!r.success) return;
  const d = r.data;

  // Bed stats
  document.querySelector('h3')?.replaceWith(
    Object.assign(document.createElement('h3'), {
      textContent: `Total Beds: ${d.beds.total}`
    })
  );

  // Update all muted paragraphs with live data
  const muted = document.querySelectorAll('p.muted');
  if (muted[0]) muted[0].textContent = `Available Beds: ${d.beds.available}`;
  if (muted[1]) muted[1].textContent = `ICU Beds: ${d.beds.icu}`;
  if (muted[2]) muted[2].textContent = `Active Emergencies: ${d.activeEmergencies}`;

  // Emergency alert
  const em = d.latestEmergency;
  if (em) {
    const alertP = document.querySelector('.card:nth-child(2) p');
    if (alertP) alertP.textContent =
      `${em.description} – ${em.distanceKm} km away – ETA ${em.etaMinutes} mins`;

    // Accept / Reject buttons
    document.querySelector('button.accept')?.addEventListener('click', async () => {
      await apiFetch(`/emergencies/${em.id}/accept`, { method: 'PATCH' });
      alert('Emergency Accepted ✅');
    });
    document.querySelector('button.reject')?.addEventListener('click', async () => {
      await apiFetch(`/emergencies/${em.id}/reject`, { method: 'PATCH' });
      alert('Emergency Rejected ❌');
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BED MANAGEMENT PAGE
// ═════════════════════════════════════════════════════════════════════════════
async function initBedManagement() {
  // Load current values
  const r = await apiFetch('/beds');
  if (r.success) {
    const d = r.data;
    const inputs = document.querySelectorAll('input[type="number"]');
    if (inputs[0]) inputs[0].value = d.total;
    if (inputs[1]) inputs[1].value = d.available;
    if (inputs[2]) inputs[2].value = d.icu;

    const sel = document.querySelector('select');
    if (sel) sel.value = d.oxygenStatus;
  }

  // Save on Update click
  document.querySelector('button.primary')?.addEventListener('click', async () => {
    const inputs  = document.querySelectorAll('input[type="number"]');
    const sel     = document.querySelector('select');
    const payload = {
      total:        inputs[0]?.value,
      available:    inputs[1]?.value,
      icu:          inputs[2]?.value,
      oxygenStatus: sel?.value,
    };
    const res = await apiFetch('/beds', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    alert(res.success ? 'Bed data updated ✅' : 'Update failed ❌');
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// PATIENTS PAGE
// ═════════════════════════════════════════════════════════════════════════════
async function initPatients() {
  const r = await apiFetch('/patients');
  if (!r.success) return;

  const container = document.querySelector('.container');
  const heading   = container.querySelector('h1');

  // Remove existing static cards (keep heading)
  container.querySelectorAll('.card').forEach(c => c.remove());

  r.data.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p class="muted">Age: ${p.age}</p>
      <p class="muted">Phone: ${p.phone}</p>
      <p class="muted">Allergies: ${p.allergies}</p>
      <p class="muted">Insurance: ${p.insurance}</p>
      <p class="muted">Insurance No.: ${p.insuranceNo}</p>
      <p class="muted">Status: <strong>${p.status}</strong></p>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button class="primary" data-id="${p.id}">Generate Admission Form</button>
      </div>
    `;
    container.appendChild(card);

    card.querySelector('button')?.addEventListener('click', async () => {
      const res = await apiFetch(`/patients/${p.id}/admit`, { method: 'POST' });
      if (res.success) {
        const f = res.data.admissionForm;
        alert(`Admission Form Generated!\n\nPatient: ${f.name}\nHospital: ${f.hospital}\nAdmitted at: ${new Date(f.admittedAt).toLocaleString()}`);
        initPatients(); // refresh
      } else {
        alert('Failed to generate form ❌');
      }
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// AMBULANCE TRACKING PAGE
// ═════════════════════════════════════════════════════════════════════════════
async function initAmbulanceTracking() {
  const r = await apiFetch('/ambulances');
  if (!r.success) return;

  const container = document.querySelector('.container');
  container.querySelectorAll('.card').forEach(c => c.remove());

  r.data.forEach(a => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <p>🚑 Ambulance #${a.id} – <strong>${a.status}</strong> – ETA ${a.etaMinutes} mins</p>
      <p class="muted">Last known position: ${a.lat.toFixed(4)}, ${a.lng.toFixed(4)}</p>
      <div class="map-placeholder">
        Map – Lat: ${a.lat}, Lng: ${a.lng}
      </div>
    `;
    container.appendChild(card);
  });

  // Poll every 10 seconds for live ETA updates
  setTimeout(initAmbulanceTracking, 10_000);
}

// ═════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═════════════════════════════════════════════════════════════════════════════
async function initSettings() {
  const r = await apiFetch('/settings');
  if (r.success) {
    const inputs = document.querySelectorAll('input[type="text"]');
    if (inputs[0]) inputs[0].value = r.data.hospitalName;
    if (inputs[1]) inputs[1].value = r.data.emergencyContact;
  }

  document.querySelector('button.primary')?.addEventListener('click', async () => {
    const inputs = document.querySelectorAll('input[type="text"]');
    const res = await apiFetch('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        hospitalName:     inputs[0]?.value,
        emergencyContact: inputs[1]?.value,
      }),
    });
    alert(res.success ? 'Settings saved ✅' : 'Save failed ❌');
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// AUTO-DETECT CURRENT PAGE & INIT
// ═════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'dashboard.html';
  const map  = {
    'dashboard.html':          initDashboard,
    'bed-management.html':     initBedManagement,
    'patients.html':           initPatients,
    'ambulance-tracking.html': initAmbulanceTracking,
    'settings.html':           initSettings,
  };
  map[page]?.();
});