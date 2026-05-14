

'use strict';

const Project    = require('../models/Project');
const Experience = require('../models/Experience');
const Contact    = require('../models/Contact');
const Visitor    = require('../models/Visitor');
const { asyncHandler } = require('../middleware/errorHandler');

// ─────────────────────────────────────────────────────────
// @route   GET /api/stats/dashboard
// @desc    Full dashboard analytics
// @access  Private
// ─────────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalProjects,
    featuredProjects,
    totalExperiences,
    totalMessages,
    unreadMessages,
    recentMessages,
    recentProjects,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ featured: true, visible: true }),
    Experience.countDocuments(),
    Contact.countDocuments(),
    Contact.countDocuments({ status: 'unread' }),
    Contact.find().sort('-createdAt').limit(5).select('name email projectType status createdAt'),
    Project.find().sort('-createdAt').limit(4).select('title category featured visible imageUrl createdAt'),
  ]);

  // Visitor stats (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const visitors = await Visitor.find({
    date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] },
  }).sort('date').select('-uniqueIPs');

  const totalVisitors = visitors.reduce((sum, v) => sum + v.count, 0);

  res.json({
    success: true,
    data: {
      counts: {
        projects   : totalProjects,
        featured   : featuredProjects,
        experiences: totalExperiences,
        messages   : totalMessages,
        unread     : unreadMessages,
        visitors   : totalVisitors,
      },
      recentMessages,
      recentProjects,
      visitorChart: visitors.map(v => ({ date: v.date, count: v.count })),
    },
  });
});

// ─────────────────────────────────────────────────────────
// @route   POST /api/stats/visit
// @desc    Record page visit (public — called by frontend)
// @access  Public
// ─────────────────────────────────────────────────────────
const recordVisit = asyncHandler(async (req, res) => {
  const ip   = req.ip;
  const page = req.body.page || '/';
  const today = new Date().toISOString().split('T')[0];

  const visitor = await Visitor.findOne({ date: today });

  if (visitor) {
    // Increment count
    visitor.count += 1;

    // Track unique IPs
    if (!visitor.uniqueIPs.includes(ip)) {
      visitor.uniqueIPs.push(ip);
    }

    // Track page views
    const current = visitor.pageViews.get(page) || 0;
    visitor.pageViews.set(page, current + 1);
    await visitor.save();
  } else {
    await Visitor.create({
      date      : today,
      count     : 1,
      uniqueIPs : [ip],
      pageViews : { [page]: 1 },
    });
  }

  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/stats/visitors
// @desc    Visitor stats for a date range
// @access  Private
// ─────────────────────────────────────────────────────────
const getVisitorStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));
  const sinceStr = since.toISOString().split('T')[0];

  const visitors = await Visitor
    .find({ date: { $gte: sinceStr } })
    .sort('date')
    .select('-uniqueIPs');

  const total = visitors.reduce((s, v) => s + v.count, 0);

  res.json({
    success: true,
    total,
    days: Number(days),
    data: visitors.map(v => ({ date: v.date, count: v.count })),
  });
});

module.exports = { getDashboard, recordVisit, getVisitorStats };