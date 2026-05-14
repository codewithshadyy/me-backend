

'use strict';

const { body, param, query, validationResult } = require('express-validator');

/**
 * Run validation and return 422 if errors found
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors : errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth ───────────────────────────────────────────────────
const loginRules = [
  body('username')
    .trim().notEmpty().withMessage('Username is required')
    .isLength({ max: 30 }).withMessage('Username too long'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

// ── Project ────────────────────────────────────────────────
const projectRules = [
  body('title')
    .trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 120 }).withMessage('Title max 120 characters'),
  body('description')
    .trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description max 2000 characters'),
  body('category')
    .isIn(['api', 'backend', 'fullstack', 'database', 'devops', 'other'])
    .withMessage('Invalid category'),
  body('githubLink').optional({ checkFalsy: true })
    .isURL().withMessage('GitHub link must be a valid URL'),
  body('liveLink').optional({ checkFalsy: true })
    .isURL().withMessage('Live link must be a valid URL'),
  body('featured').optional().isBoolean().withMessage('Featured must be boolean'),
  body('techStack').optional().isArray().withMessage('Tech stack must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

// ── Experience ─────────────────────────────────────────────
const experienceRules = [
  body('role')
    .trim().notEmpty().withMessage('Role is required')
    .isLength({ max: 100 }).withMessage('Role max 100 characters'),
  body('company')
    .trim().notEmpty().withMessage('Company is required')
    .isLength({ max: 100 }).withMessage('Company max 100 characters'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').optional({ checkFalsy: true })
    .isISO8601().withMessage('End date must be a valid date'),
  body('responsibilities').optional().isArray().withMessage('Responsibilities must be an array'),
  body('technologies').optional().isArray().withMessage('Technologies must be an array'),
];

// ── Contact ────────────────────────────────────────────────
const contactRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('phone').optional({ checkFalsy: true })
    .matches(/^[+\d\s()-]{7,20}$/).withMessage('Invalid phone number'),
  body('message')
    .trim().notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 3000 }).withMessage('Message must be 10–3000 characters'),
  body('projectType').optional({ checkFalsy: true }).isString(),
  body('budget').optional({ checkFalsy: true }).isString(),
  body('collaboration').optional().isBoolean(),
];

// ── MongoID param ──────────────────────────────────────────
const mongoIdParam = (field = 'id') => [
  param(field)
    .isMongoId().withMessage(`Invalid ${field} format`),
];

// ── Pagination query ───────────────────────────────────────
const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
];

module.exports = {
  validate,
  loginRules,
  changePasswordRules,
  projectRules,
  experienceRules,
  contactRules,
  mongoIdParam,
  paginationQuery,
};