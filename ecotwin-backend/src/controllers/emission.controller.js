// =============================================
// EcoTwin AI – controllers/emission.controller.js
// Historical emission data queries
// =============================================
const DeviceReading = require('../models/DeviceReading');

// GET /api/emissions?deviceId=&from=&to=&interval=hour
exports.getEmissions = async (req, res, next) => {
  try {
    const { deviceId, from, to, limit = 200 } = req.query;
    const filter = {};
    if (deviceId) filter.deviceId = deviceId.toUpperCase();
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const readings = await DeviceReading.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ readings, count: readings.length });
  } catch (err) { next(err); }
};

// GET /api/emissions/chart?hours=24
// Returns boiler/motor/generator buckets for the dashboard chart (24h)
exports.getChartData = async (req, res, next) => {
  try {
    const hours   = parseInt(req.query.hours) || 24;
    const since   = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Aggregate average emission per device type per 2-hour bucket
    const data = await DeviceReading.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: 'deviceId',
          as: 'device'
      }},
      { $unwind: { path: '$device', preserveNullAndEmpty: true } },
      { $group: {
          _id: {
            bucket: { $dateToString: { format: '%H:00', date: '$timestamp' } },
            type:   { $ifNull: ['$device.type', 'Other'] }
          },
          avgEmission: { $avg: '$emission' },
          count:        { $sum: 1 }
      }},
      { $sort: { '_id.bucket': 1 } }
    ]);

    res.json({ data });
  } catch (err) { next(err); }
};

// GET /api/emissions/summary
// Overall totals for dashboard KPIs
exports.getSummary = async (req, res, next) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [stats24h] = await DeviceReading.aggregate([
      { $match: { timestamp: { $gte: since24h } } },
      { $group: {
          _id: null,
          totalEmission: { $sum: '$emission' },
          avgEmission:   { $avg: '$emission' },
          maxEmission:   { $max: '$emission' },
          count:         { $sum: 1 }
      }}
    ]);

    const [stats7d] = await DeviceReading.aggregate([
      { $match: { timestamp: { $gte: since7d } } },
      { $group: {
          _id: null,
          totalEmission: { $sum: '$emission' },
          avgEmission:   { $avg: '$emission' },
      }}
    ]);

    // Estimate carbon credits: 1 credit per 1 kg CO₂ below threshold
    const safeLimit    = 30; // kg/hr
    const creditRate   = 3000; // ₹ per credit (ICM market rate)
    const creditsEarned = Math.max(0, Math.round(
      ((safeLimit - (stats24h?.avgEmission || 0)) / safeLimit) * 142
    ));

    res.json({
      last24h: stats24h || {},
      last7d:  stats7d  || {},
      creditsEarned,
      estimatedValueINR: creditsEarned * creditRate,
    });
  } catch (err) { next(err); }
};
