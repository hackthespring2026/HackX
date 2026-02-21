const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true }, // applicationId used as conversationId
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  messageType: { type: String, enum: ['text', 'deal', 'system'], default: 'text' },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
