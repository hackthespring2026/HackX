const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  proposal: { type: String, required: true },
  proposedRate: { type: Number, required: true },
  deliverables: [String],
  timeline: String,
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  dealAmount: Number,
  completedAt: Date,
  rating: {
    brandRating: { score: Number, review: String },
    creatorRating: { score: Number, review: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
