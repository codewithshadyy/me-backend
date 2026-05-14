/**
 * routes/contact.js
 */
'use strict';

const express = require('express');
const router  = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const {
  submitContact, getMessages, getMessage,
  updateStatus, addNotes, deleteMessage, getContactStats,
} = require('../controllers/contactController');

const { protect }                            = require('../middleware/auth');
const { contactRules, mongoIdParam, validate } = require('../middleware/validate');

// Stricter rate limiter for contact form (prevent spam)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max     : 5,
  message : { success: false, message: 'Too many messages sent. Please wait an hour before trying again.' },
  keyGenerator: ipKeyGenerator,
});

// ── Public ─────────────────────────────────────────────────
router.post('/', contactLimiter, contactRules, validate, submitContact);

// ── Private (Admin) ────────────────────────────────────────
router.get('/',          protect, getMessages);
router.get('/stats',     protect, getContactStats);
router.get('/:id',       protect, mongoIdParam('id'), validate, getMessage);
router.patch('/:id/status', protect, mongoIdParam('id'), validate, updateStatus);
router.patch('/:id/notes',  protect, mongoIdParam('id'), validate, addNotes);
router.delete('/:id',       protect, mongoIdParam('id'), validate, deleteMessage);

module.exports = router;