// routes/emission.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/emission.controller');
const { protect } = require('../middleware/auth');

router.get('/',         protect, ctrl.getEmissions);
router.get('/chart',    protect, ctrl.getChartData);
router.get('/summary',  protect, ctrl.getSummary);

module.exports = router;
