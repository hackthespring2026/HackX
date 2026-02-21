const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { analyzeCreator } = require('../utils/aiAnalysis');

// Get all creators with filters
router.get('/creators', auth, async (req, res) => {
  try {
    const {
      niche, minFollowers, maxFollowers, minEngagement,
      platform, location, search, sort, page = 1, limit = 12
    } = req.query;

    const query = { role: 'creator', isBanned: false, isActive: true };

    if (niche) query['creatorProfile.niche'] = { $in: niche.split(',') };
    if (minFollowers) query['creatorProfile.totalFollowers'] = { $gte: parseInt(minFollowers) };
    if (maxFollowers) {
      query['creatorProfile.totalFollowers'] = {
        ...query['creatorProfile.totalFollowers'],
        $lte: parseInt(maxFollowers)
      };
    }
    if (minEngagement) query['creatorProfile.engagementRate'] = { $gte: parseFloat(minEngagement) };
    if (location) query['creatorProfile.location'] = { $regex: location, $options: 'i' };
    if (search) query['$or'] = [
      { name: { $regex: search, $options: 'i' } },
      { 'creatorProfile.bio': { $regex: search, $options: 'i' } }
    ];

    let sortObj = { createdAt: -1 };
    if (sort === 'followers') sortObj = { 'creatorProfile.totalFollowers': -1 };
    if (sort === 'engagement') sortObj = { 'creatorProfile.engagementRate': -1 };
    if (sort === 'aiScore') sortObj = { 'creatorProfile.aiScore': -1 };

    const total = await User.countDocuments(query);
    const creators = await User.find(query)
      .select('-password')
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ creators, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get creator by ID
router.get('/creators/:id', async (req, res) => {
  try {
    const creator = await User.findById(req.params.id).select('-password');
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ error: 'Creator not found' });
    }
    res.json({ creator });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    if (req.user.role === 'creator') {
      user.creatorProfile = { ...user.creatorProfile.toObject(), ...updates.creatorProfile };
      if (updates.name) user.name = updates.name;

      // Run AI analysis when social links updated
      if (updates.creatorProfile?.socialLinks) {
        const analysis = analyzeCreator(updates.creatorProfile.socialLinks);
        user.creatorProfile.aiScore = analysis.aiScore;
        user.creatorProfile.engagementRate = analysis.engagementRate;
        user.creatorProfile.fakeFollowerPercentage = analysis.fakeFollowerPercentage;
        user.creatorProfile.contentConsistency = analysis.contentConsistency;
        user.creatorProfile.totalFollowers = analysis.totalFollowers;
        user.creatorProfile.audienceLocations = analysis.audienceLocations;
      }
    } else if (req.user.role === 'brand') {
      user.brandProfile = { ...user.brandProfile?.toObject(), ...updates.brandProfile };
      if (updates.name) user.name = updates.name;
    }

    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run AI analysis manually
router.post('/analyze/:id', auth, async (req, res) => {
  try {
    const creator = await User.findById(req.params.id);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const analysis = analyzeCreator(creator.creatorProfile?.socialLinks || {});
    creator.creatorProfile.aiScore = analysis.aiScore;
    creator.creatorProfile.engagementRate = analysis.engagementRate;
    creator.creatorProfile.fakeFollowerPercentage = analysis.fakeFollowerPercentage;
    creator.creatorProfile.contentConsistency = analysis.contentConsistency;
    creator.creatorProfile.totalFollowers = analysis.totalFollowers;
    creator.creatorProfile.audienceLocations = analysis.audienceLocations;

    await creator.save();
    res.json({ message: 'Analysis complete', analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shortlist creator
router.post('/shortlist/:creatorId', auth, async (req, res) => {
  try {
    const { campaignId } = req.body;
    const Campaign = require('../models/Campaign');
    
    const campaign = await Campaign.findOne({ _id: campaignId, brand: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    if (!campaign.shortlistedCreators.includes(req.params.creatorId)) {
      campaign.shortlistedCreators.push(req.params.creatorId);
      await campaign.save();
    }

    res.json({ message: 'Creator shortlisted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
