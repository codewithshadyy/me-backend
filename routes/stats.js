

/**
 * routes/stats.js
 */
'use strict';

const express = require('express');
const router  = express.Router();

const { getDashboard, recordVisit, getVisitorStats } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');

// Public — visitor tracking
router.post('/visit', recordVisit);

// Private — dashboard analytics
router.get('/dashboard', protect, getDashboard);
router.get('/visitors',  protect, getVisitorStats);

module.exports = router;