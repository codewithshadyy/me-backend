

/**
 * routes/upload.js
 * File upload endpoints
 */
'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');

const { protect }                                           = require('../middleware/auth');
const { upload, toProjectsFolder, toAvatarsFolder, toMiscFolder, buildFileUrl, deleteFile } = require('../middleware/upload');
const { asyncHandler, ApiError }                           = require('../middleware/errorHandler');

// ── POST /api/upload/project-images ───────────────────────
// Upload 1–10 project images
router.post(
  '/project-images',
  protect,
  toProjectsFolder,
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw new ApiError('No files uploaded', 400);

    const urls = req.files.map(f => ({
      filename: f.filename,
      url     : buildFileUrl(req, f.path),
      size    : f.size,
      mimetype: f.mimetype,
    }));

    res.status(201).json({
      success: true,
      count  : urls.length,
      files  : urls,
      urls   : urls.map(u => u.url),
    });
  })
);

// ── POST /api/upload/avatar ────────────────────────────────
router.post(
  '/avatar',
  protect,
  toAvatarsFolder,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError('No file uploaded', 400);

    res.status(201).json({
      success : true,
      filename: req.file.filename,
      url     : buildFileUrl(req, req.file.path),
      size    : req.file.size,
    });
  })
);

// ── POST /api/upload/single ────────────────────────────────
router.post(
  '/single',
  protect,
  toMiscFolder,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError('No file uploaded', 400);
    res.status(201).json({
      success : true,
      filename: req.file.filename,
      url     : buildFileUrl(req, req.file.path),
    });
  })
);

// ── DELETE /api/upload ─────────────────────────────────────
// Delete a file by relative path or full URL
router.delete(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { filePath } = req.body;
    if (!filePath) throw new ApiError('filePath is required', 400);

    // Extract relative path from URL if needed
    const rel = filePath.includes('/uploads/')
      ? filePath.split('/uploads/')[1]
      : filePath;

    // Prevent path traversal
    const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
    deleteFile(safe);

    res.json({ success: true, message: 'File deleted', file: safe });
  })
);

// ── GET /api/upload/list ───────────────────────────────────
router.get(
  '/list',
  protect,
  asyncHandler(async (req, res) => {
    const { folder = 'projects' } = req.query;
    const UPLOAD_BASE = path.resolve(process.env.UPLOAD_PATH || './uploads');
    const dirPath     = path.join(UPLOAD_BASE, path.normalize(folder).replace(/^\.\./, ''));

    if (!fs.existsSync(dirPath)) {
      return res.json({ success: true, files: [] });
    }

    const files = fs.readdirSync(dirPath)
      .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
      .map(f => ({
        filename: f,
        url     : `${req.protocol}://${req.get('host')}/uploads/${folder}/${f}`,
        size    : fs.statSync(path.join(dirPath, f)).size,
      }));

    res.json({ success: true, count: files.length, folder, files });
  })
);

module.exports = router;