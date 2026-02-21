// =============================================
// EcoTwin AI – controllers/company.controller.js
// Company setup & configuration (Setup panel)
// =============================================
const Company = require('../models/Company');

// GET /api/company
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.user.company);
    if (!company) return res.status(404).json({ error: 'Company not found.' });
    res.json({ company });
  } catch (err) { next(err); }
};

// PUT /api/company  – saves the whole company setup form
exports.updateCompany = async (req, res, next) => {
  try {
    const {
      companyName, facilityName, industryType, employeeCount,
      city, country, factoryArea, prodCapacity, facilityDesc, gstNumber,
      equipment, shiftsPerDay, workingDays,
      thresholds,
      alertContacts, alertChannels,
      frameworks, netZeroYear, sustainNotes,
    } = req.body;

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      {
        companyName, facilityName, industryType, employeeCount,
        city, country, factoryArea, prodCapacity, facilityDesc, gstNumber,
        equipment, shiftsPerDay, workingDays,
        thresholds,
        alertContacts, alertChannels,
        frameworks, netZeroYear, sustainNotes,
      },
      { new: true, runValidators: true }
    );

    if (!company) return res.status(404).json({ error: 'Company not found.' });
    res.json({ company, message: 'Settings saved.' });
  } catch (err) { next(err); }
};

// POST /api/company/equipment  – add single equipment unit
exports.addEquipment = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { $push: { equipment: req.body } },
      { new: true }
    );
    res.status(201).json({ equipment: company.equipment });
  } catch (err) { next(err); }
};

// DELETE /api/company/equipment/:equipId
exports.removeEquipment = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { $pull: { equipment: { _id: req.params.equipId } } },
      { new: true }
    );
    res.json({ equipment: company.equipment });
  } catch (err) { next(err); }
};
