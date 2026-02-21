// =============================================
// EcoTwin AI – controllers/alert.controller.js
// =============================================
const Alert = require('../models/Alert');

// GET /api/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const { type, isResolved = false, page = 1, limit = 20 } = req.query;
    const filter = { isResolved: isResolved === 'true' };
    if (type) filter.type = type;

    const alerts = await Alert.find(filter)
      .sort({ triggeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(filter);
    res.json({ alerts, total });
  } catch (err) { next(err); }
};

// PUT /api/alerts/:id/resolve
exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, resolvedAt: new Date(), type: 'resolved' },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert });
  } catch (err) { next(err); }
};

// PUT /api/alerts/:id/read
exports.markRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert });
  } catch (err) { next(err); }
};

// DELETE /api/alerts/:id
exports.deleteAlert = async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted.' });
  } catch (err) { next(err); }
};
