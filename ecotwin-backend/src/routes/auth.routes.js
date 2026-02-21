// routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register',         ctrl.register);
router.post('/login',            ctrl.login);
router.get('/me',                protect, ctrl.getMe);
router.put('/update-profile',    protect, ctrl.updateProfile);
router.put('/change-password',   protect, ctrl.changePassword);

module.exports = router;
