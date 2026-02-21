// routes/device.routes.js
// POST /api/device-data is PUBLIC so IoT sensors can post without auth
const router = require('express').Router();
const ctrl   = require('../controllers/device.controller');
const { protect, authorise } = require('../middleware/auth');

// IoT sensor posts data – no auth required (use API key in production)
router.post('/', ctrl.ingestDeviceData);

// Dashboard reads – require login
router.get('/',                           protect, ctrl.getAllDevices);
router.get('/:deviceId',                  protect, ctrl.getDevice);
router.put('/:deviceId/threshold',        protect, authorise('admin','operator'), ctrl.updateThreshold);
router.delete('/:deviceId',               protect, authorise('admin'), ctrl.deleteDevice);

module.exports = router;
