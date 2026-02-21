// =============================================
// EcoTwin AI – models/DeviceReading.js
// Time-series emission readings per device
// =============================================
const mongoose = require('mongoose');

const DeviceReadingSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true, index: true },
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },

  emission:  { type: Number, required: true },   // kg/hr CO₂ equivalent
  nox:       { type: Number },                   // mg/m³ – optional extended data
  sox:       { type: Number },
  pm25:      { type: Number },
  pm10:      { type: Number },

  threshold: { type: Number },
  status:    { type: String, enum: ['ok','warn','danger'] },

  timestamp: { type: Date, default: Date.now, index: true },
}, {
  // Auto-expire readings older than 90 days to keep the DB lean
  expireAfterSeconds: 60 * 60 * 24 * 90,
  timestamps: false,
});

module.exports = mongoose.model('DeviceReading', DeviceReadingSchema);
