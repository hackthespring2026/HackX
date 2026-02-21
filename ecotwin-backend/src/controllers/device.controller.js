// =============================================
// EcoTwin AI – controllers/device.controller.js
// Core IoT device-data ingestion endpoint
// POST /api/device-data   ← sensors call this
// =============================================
const Device        = require('../models/Device');
const DeviceReading = require('../models/DeviceReading');
const Alert         = require('../models/Alert');
const Notification  = require('../models/Notification');
const { broadcast } = require('../config/websocket');

// ── Helper: determine status from load % ────
const getStatus = (emission, threshold) => {
  const pct = emission / threshold;
  if (pct >= 1)   return 'danger';
  if (pct >= 0.8) return 'warn';
  return 'ok';
};

// ── POST /api/device-data ───────────────────
// Body: { deviceId, emission, timestamp?, type?, plant?, nox?, sox?, pm25?, pm10? }
exports.ingestDeviceData = async (req, res, next) => {
  try {
    const {
      deviceId, emission, timestamp,
      type = 'Other', plant = 'Plant 1 — Ahmedabad',
      nox, sox, pm25, pm10,
    } = req.body;

    if (!deviceId || emission === undefined) {
      return res.status(400).json({ error: 'deviceId and emission are required.' });
    }

    const emissionVal  = parseFloat(emission);
    const readingTime  = timestamp ? new Date(timestamp) : new Date();
    const isNew        = !(await Device.exists({ deviceId }));

    // ── Upsert device ──────────────────────
    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          emission: emissionVal,
          lastSeen: readingTime,
          status:   getStatus(emissionVal, 30),
          isNew:    false,
        },
        $setOnInsert: {
          deviceId,
          type,
          plant,
          threshold: 30,
          registeredAt: readingTime,
        },
      },
      { upsert: true, new: true }
    );

    // ── Save time-series reading ───────────
    const reading = await DeviceReading.create({
      deviceId,
      emission: emissionVal,
      threshold: device.threshold,
      status:    getStatus(emissionVal, device.threshold),
      timestamp: readingTime,
      nox, sox, pm25, pm10,
    });

    // ── Fire alerts if needed ──────────────
    const pct = emissionVal / device.threshold;
    if (pct >= 1) {
      await Alert.create({
        deviceId,
        deviceName: device.name || deviceId,
        plant:      device.plant,
        type:       'danger',
        message:    `${deviceId} exceeded emission threshold! (${emissionVal} kg/hr vs ${device.threshold} kg/hr limit)`,
        emission:   emissionVal,
        threshold:  device.threshold,
      });
    } else if (pct >= 0.8) {
      await Alert.create({
        deviceId,
        deviceName: device.name || deviceId,
        plant:      device.plant,
        type:       'warn',
        message:    `${deviceId} approaching threshold — ${Math.round(pct * 100)}% load.`,
        emission:   emissionVal,
        threshold:  device.threshold,
      });
    }

    // ── Broadcast via WebSocket ────────────
    broadcast({
      deviceId,
      emission:    emissionVal,
      threshold:   device.threshold,
      status:      getStatus(emissionVal, device.threshold),
      plant:       device.plant,
      type:        device.type,
      timestamp:   readingTime,
      isNew,
    });

    // ── Response (mirrors the frontend API log format) ──
    res.status(isNew ? 201 : 200).json({
      ok:       true,
      isNew,
      deviceId,
      emission: emissionVal,
      status:   getStatus(emissionVal, device.threshold),
      message:  isNew ? `Device ${deviceId} auto-registered.` : `Reading recorded for ${deviceId}.`,
      timestamp: readingTime,
    });
  } catch (err) { next(err); }
};

// ── GET /api/device-data ─────────────────────
// Returns all devices (paginated)
exports.getAllDevices = async (req, res, next) => {
  try {
    const { status, plant, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (plant)  filter.plant  = plant;

    const devices = await Device.find(filter)
      .sort({ lastSeen: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Device.countDocuments(filter);
    res.json({ devices, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/device-data/:deviceId ───────────
exports.getDevice = async (req, res, next) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.deviceId.toUpperCase() });
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    res.json({ device });
  } catch (err) { next(err); }
};

// ── PUT /api/device-data/:deviceId/threshold ─
exports.updateThreshold = async (req, res, next) => {
  try {
    const { threshold } = req.body;
    if (!threshold || isNaN(threshold))
      return res.status(400).json({ error: 'Valid threshold (number) required.' });

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId.toUpperCase() },
      { threshold: parseFloat(threshold) },
      { new: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    res.json({ device });
  } catch (err) { next(err); }
};

// ── DELETE /api/device-data/:deviceId ────────
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndDelete({ deviceId: req.params.deviceId.toUpperCase() });
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    res.json({ message: `Device ${device.deviceId} removed.` });
  } catch (err) { next(err); }
};
