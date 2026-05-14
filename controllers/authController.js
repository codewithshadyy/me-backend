

'use strict';

const Admin             = require('../models/Admin');
const { generateToken } = require('../middlewares/auth');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const bcrypt = require("bcrypt")

// ── Auth-specific stricter rate limiter ────────────────────
const authLimiter = rateLimit({
  windowMs       : 15 * 60 * 1000, // 15 minutes
  max            : parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders  : false,
  message        : { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  keyGenerator   : (req) => ipKeyGenerator(req) + ':' + (req.body?.username || ''),
});

// ─────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Admin login — returns JWT
// @access  Public
// ─────────────────────────────────────────────────────────
const register = asyncHandler(async (req,res) => {

    try {
        const {username, password} =req.body
        const userExists = await Admin.findOne({username})

        if(userExists){
            res.status(400).json({message:"user takken"})
        }

        hashedPassword = await bcrypt.hash(password, 10)
        const user = await Admin.create({
            username,
            password:hashedPassword
        })

        res.status(201).json({message:"user created"})
        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
        
    }
    
})
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find admin (explicitly select password field)
  const admin = await Admin.findOne({username}).select('+password +loginAttempts +lockUntil');

  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Check account lock
  if (admin.isLocked) {
    const remaining = Math.ceil((admin.lockUntil - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Account locked. Try again in ${remaining} minute(s).`,
    });
  }

  // Verify password
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    await admin.incrementLoginAttempts();
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Reset attempts on success
  await admin.resetLoginAttempts();

  const token = generateToken(admin._id, admin.role);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    admin: {
      id      : admin._id,
      username: admin.username,
      email   : admin.email,
      role    : admin.role,
    },
  });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current admin profile
// @access  Private
// ─────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// ─────────────────────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Logout (client-side — just confirmation)
// @access  Private
// ─────────────────────────────────────────────────────────
const logout = asyncHandler(async (_req, res) => {
  // JWT is stateless — actual invalidation needs a denylist
  // For now, client should delete the token
  res.json({ success: true, message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────
// @route   PUT /api/auth/change-password
// @desc    Change admin password
// @access  Private
// ─────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select('+password');
  if (!admin) throw new ApiError('Admin not found', 404);

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError('Current password is incorrect', 401);

  admin.password = newPassword;
  await admin.save();

  const token = generateToken(admin._id, admin.role);
  res.json({ success: true, message: 'Password changed successfully', token });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/auth/verify
// @desc    Verify token is still valid
// @access  Private
// ─────────────────────────────────────────────────────────
const verifyToken = asyncHandler(async (req, res) => {
  res.json({ success: true, valid: true, admin: req.admin });
});

module.exports = { login, getMe, logout, changePassword, verifyToken, authLimiter, register };