// routes/alert.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/alert.controller');
const { protect } = require('../middleware/auth');

router.get('/',               protect, ctrl.getAlerts);
router.put('/:id/resolve',    protect, ctrl.resolveAlert);
router.put('/:id/read',       protect, ctrl.markRead);
router.delete('/:id',         protect, ctrl.deleteAlert);

module.exports = router;
