// =============================================
// EcoTwin AI – middleware/auth.js
// JWT verification middleware
// =============================================
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorised. No token.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ error: 'User not found.' });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Role-based guard – usage: authorise('admin')
const authorise = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Role '${req.user.role}' is not permitted.` });
  }
  next();
};

module.exports = { protect, authorise };
