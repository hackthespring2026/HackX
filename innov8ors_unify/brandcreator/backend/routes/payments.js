const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Application = require('../models/Application');
const { auth } = require('../middleware/auth');

// BRAND: Initiate payment (put money in escrow/hold)
router.post('/initiate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: 'Only brands can initiate payment' });
    }

    const { applicationId, amount, paymentMethod } = req.body;

    const application = await Application.findOne({
      _id: applicationId,
      brand: req.user._id,
      status: 'accepted'
    });

    if (!application) {
      return res.status(404).json({ error: 'Accepted application not found' });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ application: applicationId });
    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already initiated for this application' });
    }

    const platformFee = Math.round(amount * 0.10); // 10% platform fee
    const creatorAmount = amount - platformFee;

    // Simulate payment processing (Fake)
    const payment = new Payment({
      application: applicationId,
      campaign: application.campaign,
      brand: req.user._id,
      creator: application.creator,
      amount,
      platformFee,
      creatorAmount,
      status: 'held',
      paymentMethod: {
        type: paymentMethod.type || 'card',
        last4: paymentMethod.last4 || '4242',
        upiId: paymentMethod.upiId || '',
        bank: paymentMethod.bank || '',
      },
      paidAt: new Date(),
      heldAt: new Date(),
    });

    await payment.save();

    // Update application status
    application.dealAmount = amount;
    await application.save();

    res.status(201).json({
      message: 'Payment successful! Amount is held in escrow.',
      payment,
      transactionId: payment.transactionId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BRAND: Release payment to creator (after content approval)
router.post('/release/:paymentId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: 'Only brands can release payment' });
    }

    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      brand: req.user._id,
      status: 'held'
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found or already released' });
    }

    payment.status = 'released';
    payment.releasedAt = new Date();
    await payment.save();

    // Mark application as completed
    await Application.findByIdAndUpdate(payment.application, {
      status: 'completed',
      completedAt: new Date()
    });

    res.json({
      message: `₹${payment.creatorAmount.toLocaleString()} released to creator successfully!`,
      payment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BRAND: Request refund (if creator didn't deliver)
router.post('/refund/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      brand: req.user._id,
      status: 'held'
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.notes = req.body.reason || 'Refund requested by brand';
    await payment.save();

    res.json({ message: 'Refund processed. Amount will be credited back.', payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment by application
router.get('/application/:applicationId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ application: req.params.applicationId })
      .populate('brand', 'name brandProfile')
      .populate('creator', 'name creatorProfile');

    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all payments for brand
router.get('/brand/all', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ brand: req.user._id })
      .populate('creator', 'name creatorProfile avatar')
      .populate('campaign', 'title')
      .populate('application')
      .sort({ createdAt: -1 });

    const totalHeld = payments.filter(p => p.status === 'held').reduce((s, p) => s + p.amount, 0);
    const totalReleased = payments.filter(p => p.status === 'released').reduce((s, p) => s + p.amount, 0);

    res.json({ payments, totalHeld, totalReleased });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all payments for creator
router.get('/creator/all', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ creator: req.user._id })
      .populate('brand', 'name brandProfile avatar')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    const totalEarned = payments.filter(p => p.status === 'released').reduce((s, p) => s + p.creatorAmount, 0);
    const totalPending = payments.filter(p => p.status === 'held').reduce((s, p) => s + p.creatorAmount, 0);

    res.json({ payments, totalEarned, totalPending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all payments
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

    const payments = await Payment.find()
      .populate('brand', 'name email')
      .populate('creator', 'name email')
      .populate('campaign', 'title')
      .sort({ createdAt: -1 });

    const totalVolume = payments.reduce((s, p) => s + p.amount, 0);
    const totalFees = payments.reduce((s, p) => s + p.platformFee, 0);

    res.json({ payments, totalVolume, totalFees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
