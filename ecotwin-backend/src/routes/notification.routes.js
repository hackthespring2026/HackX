// routes/notification.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.get('/',             protect, ctrl.getNotifications);
router.put('/read-all',     protect, ctrl.markAllRead);
router.delete('/clear',     protect, ctrl.clearAll);

module.exports = router;
