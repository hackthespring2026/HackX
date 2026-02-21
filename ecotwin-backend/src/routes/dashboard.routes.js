// routes/dashboard.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.get('/stats',        protect, ctrl.getDashboardStats);
router.get('/live-devices', protect, ctrl.getLiveDevices);

module.exports = router;
