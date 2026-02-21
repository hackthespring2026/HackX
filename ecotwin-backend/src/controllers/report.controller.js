// =============================================
// EcoTwin AI – controllers/report.controller.js
// Compliance report generation
// =============================================
const Device        = require('../models/Device');
const DeviceReading = require('../models/DeviceReading');
const Alert         = require('../models/Alert');

// GET /api/reports/generate?period=weekly|monthly|custom&from=&to=
exports.generateReport = async (req, res, next) => {
  try {
    const { period = 'weekly', from, to } = req.query;

    let fromDate, toDate;
    const now = new Date();

    if (period === 'weekly') {
      fromDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      toDate   = now;
    } else if (period === 'monthly') {
      fromDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      toDate   = now;
    } else {
      fromDate = new Date(from);
      toDate   = new Date(to);
    }

    // Aggregate emission stats
    const [emStats] = await DeviceReading.aggregate([
      { $match: { timestamp: { $gte: fromDate, $lte: toDate } } },
      { $group: {
          _id: null,
          totalEmission: { $sum: '$emission' },
          avgEmission:   { $avg: '$emission' },
          maxEmission:   { $max: '$emission' },
          readingsCount: { $sum: 1 },
          daysAboveLimit: {
            $sum: { $cond: [{ $gte: ['$emission', 30] }, 1, 0] }
          },
      }}
    ]);

    const deviceCount = await Device.countDocuments();

    const alertCounts = await Alert.aggregate([
      { $match: { triggeredAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Build compliance score
    const totalReadings  = emStats?.readingsCount || 1;
    const overLimitCount = emStats?.daysAboveLimit || 0;
    const complianceScore = (((totalReadings - overLimitCount) / totalReadings) * 100).toFixed(1);

    const report = {
      generatedAt:    new Date(),
      period,
      from:           fromDate,
      to:             toDate,
      facility:       'Plant 1 — Ahmedabad',         // TODO: pull from company
      deviceCount,
      emissions: {
        total:   +(emStats?.totalEmission || 0).toFixed(2),
        average: +(emStats?.avgEmission   || 0).toFixed(2),
        peak:    +(emStats?.maxEmission   || 0).toFixed(2),
        safeLimit: 30,
        readingsCount: totalReadings,
        overLimitReadings: overLimitCount,
      },
      complianceScore: parseFloat(complianceScore),
      complianceStatus: complianceScore >= 95 ? 'Compliant' : complianceScore >= 80 ? 'Partial' : 'Non-Compliant',
      alerts: alertCounts.reduce((acc, a) => ({ ...acc, [a._id]: a.count }), {}),
      carbonCredits: Math.round((1 - overLimitCount / totalReadings) * 142),
      frameworks:    ['CPCB', 'ISO 14001', 'GHG Protocol'],
    };

    res.json({ report });
  } catch (err) { next(err); }
};

// GET /api/reports/list
exports.listReports = async (req, res) => {
  // Placeholder – in production, saved report documents would be listed here
  res.json({
    reports: [
      { id: 'r1', name: 'Weekly Report – Feb 2026', period: 'weekly', generatedAt: new Date(), complianceScore: 98.7 },
      { id: 'r2', name: 'Monthly Report – Jan 2026', period: 'monthly', generatedAt: new Date(Date.now() - 86400000 * 7), complianceScore: 96.2 },
    ]
  });
};
