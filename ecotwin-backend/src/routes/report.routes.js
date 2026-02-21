// routes/report.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/report.controller');
const { protect } = require('../middleware/auth');

router.get('/generate', protect, ctrl.generateReport);
router.get('/list',     protect, ctrl.listReports);

module.exports = router;
