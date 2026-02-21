// =============================================
// EcoTwin AI – controllers/dashboard.controller.js
// Aggregated KPI snapshot for the live dashboard
// =============================================
const Device        = require('../models/Device');
const DeviceReading = require('../models/DeviceReading');
const Alert         = require('../models/Alert');
const CarbonCredit  = require('../models/CarbonCredit');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Device counts
    const totalDevices  = await Device.countDocuments();
    const onlineDevices = await Device.countDocuments({ status: { $in: ['online','warn'] } });
    const warnDevices   = await Device.countDocuments({ status: 'warn' });
    const dangerDevices = await Device.countDocuments({ status: 'danger' });

    // 24h emission KPIs
    const [emStats] = await DeviceReading.aggregate([
      { $match: { timestamp: { $gte: since24h } } },
      { $group: {
          _id: null,
          total: { $sum: '$emission' },
          avg:   { $avg: '$emission' },
          max:   { $max: '$emission' },
          min:   { $min: '$emission' },
      }}
    ]);

    // Active alerts
    const activeAlerts = await Alert.countDocuments({ isResolved: false });

    // Carbon credits (latest record)
    const latestCredits = await CarbonCredit.findOne().sort({ createdAt: -1 });

    // Risk score (0–100): weighted by danger/warn devices
    const riskScore = totalDevices > 0
      ? Math.round(((dangerDevices * 2 + warnDevices) / (totalDevices * 2)) * 100)
      : 0;

    // Compliance (inverse of risk)
    const compliancePct = Math.max(0, 100 - riskScore);

    res.json({
      devices: { total: totalDevices, online: onlineDevices, warn: warnDevices, danger: dangerDevices },
      emissions: emStats || { total: 0, avg: 0, max: 0, min: 0 },
      alerts: { active: activeAlerts },
      carbon: {
        credits: latestCredits?.credits || 142,
        valuationINR: latestCredits?.valuationINR || 426000,
        co2Saved: latestCredits?.co2Saved || 12840,
      },
      riskScore,
      compliancePct,
      plantRisk: riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Moderate' : 'Low',
    });
  } catch (err) { next(err); }
};

// GET /api/dashboard/live-devices
// Returns the 6 most-recently-updated devices for the IoT cards
exports.getLiveDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 }).limit(6);
    res.json({ devices });
  } catch (err) { next(err); }
};
