/**
 * routes/experiences.js
 */
'use strict';

const express = require('express');
const router  = express.Router();

const {
  getExperiences, getExperience,
  createExperience, updateExperience, deleteExperience,
  toggleVisible, reorderExperiences,
} = require('../controllers/experienceController');

const { protect }                           = require('../middleware/auth');
const { experienceRules, mongoIdParam, validate } = require('../middleware/validate');

// Public
router.get('/',    getExperiences);
router.get('/:id', mongoIdParam('id'), validate, getExperience);

// Private (Admin)
router.post('/',             protect, experienceRules, validate, createExperience);
router.put('/:id',           protect, mongoIdParam('id'), validate, updateExperience);
router.delete('/:id',        protect, mongoIdParam('id'), validate, deleteExperience);
router.patch('/:id/toggle-visible', protect, mongoIdParam('id'), validate, toggleVisible);
router.patch('/bulk/reorder',       protect, reorderExperiences);

module.exports = router;