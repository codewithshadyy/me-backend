

'use strict';

const express = require('express');
const router  = express.Router();

const {
  getProjects, getAllProjects, getProject,
  createProject, updateProject, deleteProject,
  toggleFeatured, toggleVisible, getCategories,
} = require('../controllers/projectsController');

const { protect }                    = require('../middleware/auth');
const { projectRules, mongoIdParam, paginationQuery, validate } = require('../middleware/validate');
const { upload, toProjectsFolder }   = require('../middleware/upload');

// ── Public ─────────────────────────────────────────────────
router.get('/',               paginationQuery, validate, getProjects);
router.get('/categories',     getCategories);
router.get('/:id',            getProject);

// ── Private (Admin) ────────────────────────────────────────
router.get('/admin/all',      protect, paginationQuery, validate, getAllProjects);

router.post('/',
  protect,
  toProjectsFolder,
  upload.array('images', 10),
  projectRules,
  validate,
  createProject
);

router.put('/:id',
  protect,
  mongoIdParam('id'), validate,
  toProjectsFolder,
  upload.array('images', 10),
  updateProject
);

router.delete('/:id',         protect, mongoIdParam('id'), validate, deleteProject);
router.patch('/:id/toggle-featured', protect, mongoIdParam('id'), validate, toggleFeatured);
router.patch('/:id/toggle-visible',  protect, mongoIdParam('id'), validate, toggleVisible);

module.exports = router;