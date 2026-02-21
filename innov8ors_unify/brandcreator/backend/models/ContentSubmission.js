const mongoose = require('mongoose');

const contentSubmissionSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title: { type: String, required: true },
  description: String,

  // Submitted content links / files
  contentLinks: [{
    platform: String, // instagram, youtube, etc.
    url: String,
    type: { type: String, enum: ['post', 'reel', 'story', 'video', 'other'] },
  }],

  // File uploads (stored as base64 or path)
  files: [{
    filename: String,
    fileType: String, // image/png, video/mp4, etc.
    fileSize: Number,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Screenshots / proof
  screenshots: [String],

  deliverable: String, // which deliverable this is for

  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'revision_requested', 'rejected'],
    default: 'submitted'
  },

  brandFeedback: String,
  revisionNote: String,
  approvedAt: Date,
  submittedAt: { type: Date, default: Date.now },

}, { timestamps: true });

module.exports = mongoose.model('ContentSubmission', contentSubmissionSchema);
