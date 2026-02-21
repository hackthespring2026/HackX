const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  niche: [String],
  platforms: [{ type: String, enum: ['instagram', 'youtube', 'twitter', 'tiktok', 'all'] }],
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    currency: { type: String, default: 'INR' }
  },
  requirements: {
    minFollowers: { type: Number, default: 1000 },
    minEngagement: { type: Number, default: 1 },
    location: [String]
  },
  deliverables: [String],
  deadline: { type: Date },
  status: { type: String, enum: ['active', 'paused', 'closed', 'completed'], default: 'active' },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  shortlistedCreators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isBoosted: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
