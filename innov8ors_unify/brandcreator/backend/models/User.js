const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['creator', 'brand', 'admin'], required: true },
  avatar:    { type: String, default: '' },
  isVerified:{ type: Boolean, default: false },
  isActive:  { type: Boolean, default: true },
  isBanned:  { type: Boolean, default: false },

  creatorProfile: {
    bio:      { type: String, default: '' },
    niche:    [{ type: String }],
    location: { type: String, default: '' },

    // Only Instagram
    socialLinks: {
      instagram: {
        username:  { type: String, default: '' },
        followers: { type: Number, default: 0 },
        url:       { type: String, default: '' },
      },
    },

    // tats
    totalFollowers:        { type: Number, default: 0 },
    engagementRate:        { type: Number, default: 0 },
    aiScore:               { type: Number, default: 0 },
    fakeFollowerPercentage:{ type: Number, default: 0 },
    contentConsistency:    { type: Number, default: 0 },
    audienceLocations: [{
      country:    { type: String },
      percentage: { type: Number },
    }],

    // ML fields (stored as JSON strings)
    audienceTypes:  { type: String, default: '[]' },
    genderSplit:    { type: String, default: '[]' },
    lastPosts:      { type: String, default: '[]' },
    mlBreakdown:    { type: String, default: '{}' },
    mlLabel:        { type: String, default: '' },
    mlAnalysis:     { type: String, default: '' },
    lastAnalyzedAt: { type: Date },

    // Rate Card (all optional with defaults)
    rateCard: {
      postRate:  { type: Number, default: 0 },
      storyRate: { type: Number, default: 0 },
      videoRate: { type: Number, default: 0 },
    },

    isFeatured:        { type: Boolean, default: false },
    collaborationCount:{ type: Number,  default: 0 },
    portfolio: [{ title: String, url: String, platform: String }],
    tags: [String],
  },

  brandProfile: {
    companyName: { type: String, default: '' },
    industry:    { type: String, default: '' },
    website:     { type: String, default: '' },
    description: { type: String, default: '' },
    location:    { type: String, default: '' },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    campaignCount: { type: Number, default: 0 },
  },

}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
