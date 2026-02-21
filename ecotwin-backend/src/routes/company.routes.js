// routes/company.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/company.controller');
const { protect, authorise } = require('../middleware/auth');

router.get('/',                           protect, ctrl.getCompany);
router.put('/',                           protect, authorise('admin'), ctrl.updateCompany);
router.post('/equipment',                 protect, authorise('admin'), ctrl.addEquipment);
router.delete('/equipment/:equipId',      protect, authorise('admin'), ctrl.removeEquipment);

module.exports = router;
