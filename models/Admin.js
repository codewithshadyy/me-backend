

'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type     : String,
      required : [true, 'Username is required'],
      unique   : true,
      trim     : true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      match    : [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'],
    },
    email: {
      type     : String,
      required : [true, 'Email is required'],
      unique   : true,
      trim     : true,
      lowercase: true,
      match    : [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type     : String,
      required : [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select   : false, // never returned by default in queries
    },
    role: {
      type   : String,
      enum   : ['admin', 'super_admin'],
      default: 'admin',
    },
    isActive: {
      type   : Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type   : Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// ── Virtual: isLocked ──────────────────────────────────────
adminSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Pre-save: Hash password ────────────────────────────────
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt    = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Method: comparePassword ────────────────────────────────
adminSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Method: incrementLoginAttempts ────────────────────────
adminSchema.methods.incrementLoginAttempts = async function () {
  const LOCK_TIME    = 30 * 60 * 1000; // 30 minutes
  const MAX_ATTEMPTS = 5;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    // Reset after lock expires
    return this.updateOne({
      $set  : { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }
  return this.updateOne(updates);
};

// ── Method: resetLoginAttempts ─────────────────────────────
adminSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set  : { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

// ── Remove sensitive fields on JSON ───────────────────────
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);