

'use strict';

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

// ── Ensure upload directories exist ───────────────────────
const UPLOAD_BASE  = path.resolve(process.env.UPLOAD_PATH || './uploads');
const DIRS = ['projects', 'avatars', 'misc'];
DIRS.forEach(dir => {
  const full = path.join(UPLOAD_BASE, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// ── Storage engine ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.uploadFolder || 'misc';
    cb(null, path.join(UPLOAD_BASE, folder));
  },
  filename: (_req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// ── File filter ────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const ALLOWED_MIME = [
    'image/jpeg', 'image/jpg', 'image/png',
    'image/gif', 'image/webp', 'image/svg+xml',
  ];
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
  }
};

// ── Base multer instance ───────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize : parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files    : 10,
  },
});

// ── Middleware: set upload folder ──────────────────────────
const toProjectsFolder = (req, _res, next) => { req.uploadFolder = 'projects'; next(); };
const toAvatarsFolder  = (req, _res, next) => { req.uploadFolder = 'avatars';  next(); };
const toMiscFolder     = (req, _res, next) => { req.uploadFolder = 'misc';     next(); };

// ── Helper: build public URL from file path ────────────────
const buildFileUrl = (req, filePath) => {
  const rel = path.relative(UPLOAD_BASE, filePath).replace(/\\/g, '/');
  const protocol = req.protocol;
  const host     = req.get('host');
  return `${protocol}://${host}/uploads/${rel}`;
};

// ── Helper: delete file safely ────────────────────────────
const deleteFile = (filePath) => {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(UPLOAD_BASE, filePath);
  if (fs.existsSync(absolute)) {
    fs.unlink(absolute, (err) => {
      if (err) console.error('File delete error:', err.message);
    });
  }
};

module.exports = {
  upload,
  toProjectsFolder,
  toAvatarsFolder,
  toMiscFolder,
  buildFileUrl,
  deleteFile,
};