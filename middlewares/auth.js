



'use strict';

const jwt   = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Protect routes — verifies JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header or cookie
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch admin from DB (checks if still active)
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid. User not found.',
      });
    }
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact support.',
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token. Authentication failed.';

    return res.status(401).json({ success: false, message: msg });
  }
};

/**
 * Authorize roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.admin?.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.admin?.role}' is not authorized for this action.`,
    });
  }
  next();
};

/**
 * Optional auth — attaches admin if token present, doesn't block
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const auth  = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.split(' ')[1] : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin     = await Admin.findById(decoded.id).select('-password');
    }
  } catch (_) { /* silently fail */ }
  next();
};

/**
 * Generate JWT token
 */
const generateToken = (id, role = 'admin') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { protect, authorize, optionalAuth, generateToken };