

'use strict';

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const connectDB  = require('./config/db');
const errorHandler = require("./middlewares/errorHandler")
const { notFound } = require('./middlewares/errorHandler');

// ── Route imports ────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const projectRoutes    = require('./routes/projects');
const experienceRoutes = require('./routes/experiences');
const contactRoutes    = require('./routes/contact');
const uploadRoutes     = require('./routes/upload');
const statsRoutes      = require('./routes/stats');

// ── Connect Database ──────────────────────────────────────────
connectDB();

const app  = express();
const PORT = process.env.PORT;

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded images
}));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Global Rate Limiter ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs : parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max      : parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// ── Body Parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Static Files (uploads) ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success : true,
    status  : 'healthy',
    service : 'Portfolio API',
    version : '1.0.0',
    env     : process.env.NODE_ENV,
    uptime  : Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/projects',    projectRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/contact',     contactRoutes);
app.use('/api/upload',      uploadRoutes);
app.use('/api/stats',       statsRoutes);

// ── API root info ─────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    success : true,
    message : 'Portfolio API is running',
    version : '1.0.0',
    author  : 'Alex Oduya',
    endpoints: {
      auth        : '/api/auth',
      projects    : '/api/projects',
      experiences : '/api/experiences',
      contact     : '/api/contact',
      upload      : '/api/upload',
      stats       : '/api/stats',
      health      : '/health',
    },
  });
});

// ── 404 & Error Handlers ─────────────────────────────────────
app.use(notFound);
// app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║      Portfolio API — shadrack kipkoech          ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Status  : ✅ Running                    ║`);
  console.log(`║  Port    : ${PORT}                             ║`);
  console.log(`║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(30)} ║`);
  console.log(`║  DB      : MongoDB                       ║`);
  console.log('╚══════════════════════════════════════════╝\n');
});

// ── Graceful Shutdown ────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
console.log(`http://localhost:${process.env.PORT}/api`)

module.exports = app;