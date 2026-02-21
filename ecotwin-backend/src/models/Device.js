// =============================================
// EcoTwin AI – models/Device.js
// =============================================
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId:  { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:      { type: String, default: '' },
  type:      { type: String, enum: ['Boiler','Motor','Generator','Furnace','Compressor','Pump','Other'], default: 'Other' },
  plant:     { type: String, default: 'Plant 1 — Ahmedabad' },
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // Current live values
  emission:  { type: Number, default: 0 },     // kg/hr current reading
  threshold: { type: Number, default: 30 },    // kg/hr safe limit

  status:    { type: String, enum: ['online','offline','warn','danger'], default: 'online' },
  isNew:     { type: Boolean, default: true },

  lastSeen:  { type: Date, default: Date.now },
  registeredAt: { type: Date, default: Date.now },

  // Metadata
  firmwareVersion: { type: String, default: '1.0.0' },
  protocol:        { type: String, default: 'HTTP' },  // HTTP | MQTT
}, { timestamps: true });

// Auto-set status before each save
DeviceSchema.pre('save', function (next) {
  const pct = this.emission / this.threshold;
  if (!this.isOnline) {
    this.status = 'offline';
  } else if (pct >= 1) {
    this.status = 'danger';
  } else if (pct >= 0.8) {
    this.status = 'warn';
  } else {
    this.status = 'online';
  }
  next();
});

module.exports = mongoose.model('Device', DeviceSchema);
