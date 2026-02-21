const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  amount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 }, // 10% platform commission
  creatorAmount: { type: Number, required: true }, // amount after fee

  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'disputed'],
    default: 'pending'
  },

  // Dummy payment details
  paymentMethod: {
    type: { type: String, enum: ['card', 'upi', 'netbanking'], default: 'card' },
    last4: String,
    upiId: String,
    bank: String,
  },

  transactionId: { type: String, unique: true },
  paidAt: Date,
  heldAt: Date,
  releasedAt: Date,
  refundedAt: Date,

  // Creator bank details for release
  creatorBankDetails: {
    accountName: String,
    accountNumber: String,
    ifsc: String,
    upiId: String,
  },

  notes: String,
}, { timestamps: true });

// Auto generate transaction ID
paymentSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
