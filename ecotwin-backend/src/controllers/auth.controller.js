// =============================================
// EcoTwin AI – controllers/auth.controller.js
// =============================================
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Company = require('../models/Company');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, companyName } = req.body;

    // Create company if provided
    let company;
    if (companyName) {
      company = await Company.create({ companyName });
    }

    const user = await User.create({
      name, email, password,
      role: role || 'admin',
      company: company?._id,
    });

    if (company) {
      company.adminUser = user._id;
      await company.save();
    }

    const token = signToken(user._id);
    res.status(201).json({ token, user, company });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials.' });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, role },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ error: 'Current password incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
};
