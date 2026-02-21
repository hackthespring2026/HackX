// =============================================
// EcoTwin AI – models/Notification.js
// =============================================
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  type:     { type: String, enum: ['danger','warn','info','success'], default: 'info' },
  message:  { type: String, required: true },
  isRead:   { type: Boolean, default: false },
  meta:     { type: Object },              // optional extra data
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
