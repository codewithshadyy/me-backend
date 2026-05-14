/**
 * controllers/contactController.js
 * Contact form handling + email notifications
 */

'use strict';

const Contact    = require('../models/Contact');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { sendContactEmail, sendAutoReply } = require('../utils/mailer');

// ─────────────────────────────────────────────────────────
// @route   POST /api/contact
// @desc    Submit contact form (public)
// @access  Public
// ─────────────────────────────────────────────────────────
const submitContact = asyncHandler(async (req, res) => {
  const {
    name, email, phone, projectType,
    budget, message, collaboration,
  } = req.body;

  // Simple honeypot spam check (if a 'website' field is filled = bot)
  if (req.body.website) {
    return res.status(200).json({ success: true, message: 'Message received' }); // silently ignore
  }

  // Save to database
  const contact = await Contact.create({
    name, email, phone, projectType,
    budget, message,
    collaboration: collaboration === true || collaboration === 'true',
    status   : 'unread',
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send emails (non-blocking — don't fail if email fails)
  try {
    await Promise.all([
      sendContactEmail(contact),   // notify admin
      sendAutoReply(contact),      // confirm to sender
    ]);
  } catch (emailErr) {
    console.warn('Email delivery failed (non-critical):', emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Message received! I\'ll get back to you within 24 hours.',
    id: contact._id,
  });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/contact
// @desc    Get all messages (admin)
// @access  Private
// ─────────────────────────────────────────────────────────
const getMessages = asyncHandler(async (req, res) => {
  const {
    page   = 1,
    limit  = 20,
    status,
    sort   = '-createdAt',
  } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Contact.countDocuments(filter);
  const msgs  = await Contact.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean();

  const unread = await Contact.countDocuments({ status: 'unread' });

  res.json({
    success: true,
    count  : msgs.length,
    total,
    unread,
    page   : Number(page),
    pages  : Math.ceil(total / Number(limit)),
    messages: msgs,
  });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/contact/:id
// @desc    Get single message
// @access  Private
// ─────────────────────────────────────────────────────────
const getMessage = asyncHandler(async (req, res) => {
  const msg = await Contact.findById(req.params.id);
  if (!msg) throw new ApiError('Message not found', 404);

  // Auto-mark as read
  if (msg.status === 'unread') {
    msg.status = 'read';
    await msg.save();
  }

  res.json({ success: true, message: msg });
});

// ─────────────────────────────────────────────────────────
// @route   PATCH /api/contact/:id/status
// @desc    Update message status
// @access  Private
// ─────────────────────────────────────────────────────────
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const VALID = ['unread', 'read', 'replied', 'archived', 'spam'];

  if (!VALID.includes(status)) {
    throw new ApiError(`Invalid status. Must be one of: ${VALID.join(', ')}`, 400);
  }

  const msg = await Contact.findByIdAndUpdate(
    req.params.id,
    {
      status,
      ...(status === 'replied' ? { repliedAt: new Date() } : {}),
    },
    { new: true }
  );

  if (!msg) throw new ApiError('Message not found', 404);
  res.json({ success: true, message: 'Status updated', contact: msg });
});

// ─────────────────────────────────────────────────────────
// @route   PATCH /api/contact/:id/notes
// @desc    Add admin notes to a message
// @access  Private
// ─────────────────────────────────────────────────────────
const addNotes = asyncHandler(async (req, res) => {
  const msg = await Contact.findByIdAndUpdate(
    req.params.id,
    { adminNotes: req.body.notes },
    { new: true }
  );
  if (!msg) throw new ApiError('Message not found', 404);
  res.json({ success: true, message: 'Notes saved', contact: msg });
});

// ─────────────────────────────────────────────────────────
// @route   DELETE /api/contact/:id
// @desc    Delete a message
// @access  Private
// ─────────────────────────────────────────────────────────
const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Contact.findById(req.params.id);
  if (!msg) throw new ApiError('Message not found', 404);
  await msg.deleteOne();
  res.json({ success: true, message: 'Message deleted' });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/contact/stats
// @desc    Message stats for dashboard
// @access  Private
// ─────────────────────────────────────────────────────────
const getContactStats = asyncHandler(async (_req, res) => {
  const [total, unread, replied, spam] = await Promise.all([
    Contact.countDocuments(),
    Contact.countDocuments({ status: 'unread' }),
    Contact.countDocuments({ status: 'replied' }),
    Contact.countDocuments({ status: 'spam' }),
  ]);

  // Messages per month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const byMonth = await Contact.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id  : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.json({ success: true, stats: { total, unread, replied, spam, byMonth } });
});

module.exports = {
  submitContact, getMessages, getMessage,
  updateStatus, addNotes, deleteMessage, getContactStats,
};