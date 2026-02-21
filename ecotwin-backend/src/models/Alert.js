// =============================================
// EcoTwin AI – models/Alert.js
// =============================================
const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  deviceId:  { type: String, required: true },
  deviceName:{ type: String },
  plant:     { type: String },

  type:      { type: String, enum: ['danger','warn','info','resolved'], default: 'warn' },
  message:   { type: String, required: true },

  emission:  { type: Number },
  threshold: { type: Number },

  isRead:    { type: Boolean, default: false },
  isResolved:{ type: Boolean, default: false },
  resolvedAt:{ type: Date },

  triggeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
