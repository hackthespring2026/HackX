// Run this file to create demo accounts
// Command: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Campaign = require('./models/Campaign');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brandcreator')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => { console.error(err); process.exit(1); });

async function seed() {
  try {
    // Clear existing demo users
    await User.deleteMany({ email: { $in: ['brand@demo.com', 'creator@demo.com', 'admin@demo.com'] } });
    await Campaign.deleteMany({});

    // Create Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'demo123',
      role: 'admin',
      isVerified: true
    });
    console.log('✅ Admin created: admin@demo.com / demo123');

    // Create Brand
    const brand = await User.create({
      name: 'TechCorp India',
      email: 'brand@demo.com',
      password: 'demo123',
      role: 'brand',
      isVerified: true,
      brandProfile: {
        companyName: 'TechCorp India',
        industry: 'Technology',
        website: 'https://techcorp.in',
        description: 'Leading tech company in India specializing in mobile apps and software solutions.',
        location: 'Bangalore, India',
        campaignCount: 0
      }
    });
    console.log('✅ Brand created: brand@demo.com / demo123');

    // Create Creator
    const creator = await User.create({
      name: 'Priya Sharma',
      email: 'creator@demo.com',
      password: 'demo123',
      role: 'creator',
      isVerified: true,
      creatorProfile: {
        bio: 'Tech & lifestyle content creator from Mumbai. Helping brands reach Gen-Z audience with authentic storytelling.',
        niche: ['Tech', 'Lifestyle', 'Fashion'],
        location: 'Mumbai, India',
        totalFollowers: 125000,
        engagementRate: 4.8,
        aiScore: 82,
        fakeFollowerPercentage: 8,
        contentConsistency: 87,
        isFeatured: true,
        collaborationCount: 12,
        socialLinks: {
          instagram: { username: 'priyasharma.tech', followers: 85000, url: 'https://instagram.com/priyasharma.tech' },
          youtube: { username: 'Priya Sharma Tech', subscribers: 40000, url: 'https://youtube.com' },
        },
        rateCard: { postRate: 15000, storyRate: 5000, videoRate: 25000 },
        audienceLocations: [
          { country: 'India', percentage: 72 },
          { country: 'USA', percentage: 12 },
          { country: 'UK', percentage: 8 },
          { country: 'UAE', percentage: 5 },
          { country: 'Other', percentage: 3 }
        ],
        tags: ['tech', 'lifestyle', 'mumbai']
      }
    });
    console.log('✅ Creator created: creator@demo.com / demo123');

    // Create sample campaigns
    const campaigns = await Campaign.insertMany([
      {
        brand: brand._id,
        title: 'Summer App Launch Campaign',
        description: 'Looking for tech-savvy creators to showcase our new productivity app. We want authentic reviews and creative unboxing content.',
        niche: ['Tech', 'Lifestyle'],
        platforms: ['instagram', 'youtube'],
        budget: { min: 20000, max: 80000, currency: 'INR' },
        requirements: { minFollowers: 10000, minEngagement: 2, location: ['India'] },
        deliverables: ['1 YouTube review video', '3 Instagram Reels', '5 Stories'],
        status: 'active',
        views: 245,
        isBoosted: true,
        tags: ['tech', 'app', 'summer']
      },
      {
        brand: brand._id,
        title: 'Festive Fashion Collection',
        description: 'Seeking fashion creators to feature our latest ethnic wear collection for Diwali season.',
        niche: ['Fashion', 'Lifestyle'],
        platforms: ['instagram', 'tiktok'],
        budget: { min: 10000, max: 50000, currency: 'INR' },
        requirements: { minFollowers: 5000, minEngagement: 3 },
        deliverables: ['2 Instagram posts', '5 Reels'],
        status: 'active',
        views: 132,
      },
      {
        brand: brand._id,
        title: 'Fitness Challenge Campaign',
        description: 'Partner with us for a 30-day fitness challenge campaign. Perfect for fitness enthusiasts and lifestyle bloggers.',
        niche: ['Fitness', 'Lifestyle'],
        platforms: ['instagram', 'youtube'],
        budget: { min: 15000, max: 60000, currency: 'INR' },
        requirements: { minFollowers: 8000, minEngagement: 4 },
        deliverables: ['Weekly progress Reels', '2 YouTube vlogs'],
        status: 'active',
        views: 89,
      }
    ]);
    console.log('✅ Sample campaigns created');

    console.log('\n🎉 Demo data seeded successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Brand:   brand@demo.com   / demo123');
    console.log('   Creator: creator@demo.com / demo123');
    console.log('   Admin:   admin@demo.com   / demo123');

  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
