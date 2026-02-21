// =============================================
// EcoTwin AI – models/CarbonCredit.js
// =============================================
const mongoose = require('mongoose');

const CarbonCreditSchema = new mongoose.Schema({
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  credits:   { type: Number, required: true },          // credits earned this period
  co2Saved:  { type: Number, required: true },          // kg CO₂ saved
  valuationINR: { type: Number, default: 0 },           // ₹ value at ICM rate
  period:    { type: String },                          // e.g. '2025-W12'
  isVerified:{ type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CarbonCredit', CarbonCreditSchema);
