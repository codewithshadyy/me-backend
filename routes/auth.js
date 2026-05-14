

const express = require('express');
const router  = express.Router();

const { login, getMe, logout, changePassword, verifyToken, authLimiter } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginRules, changePasswordRules, validate } = require('../middleware/validate');

// Public
router.post('/login',  authLimiter, loginRules, validate, login);

// Private
router.get('/me',              protect, getMe);
router.post('/logout',         protect, logout);
router.get('/verify',          protect, verifyToken);
router.put('/change-password', protect, changePasswordRules, validate, changePassword);

module.exports = router;