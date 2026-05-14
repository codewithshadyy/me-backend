

'use strict';

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type     : String,
      required : [true, 'Name is required'],
      trim     : true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type     : String,
      required : [true, 'Email is required'],
      trim     : true,
      lowercase: true,
      match    : [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type : String,
      trim : true,
      match: [/^[+\d\s()-]{7,20}$/, 'Please enter a valid phone number'],
    },
    projectType: {
      type: String,
      enum: [
        'API Development',
        'Full Stack Project',
        'System Design Consultation',
        'Database Architecture',
        'Code Review / Audit',
        'Other',
        '',
      ],
      default: '',
    },
    budget: {
      type: String,
      enum: ['$500 – $2,000', '$2,000 – $5,000', '$5,000 – $15,000', '$15,000+', 'Open to discuss', ''],
      default: '',
    },
    message: {
      type     : String,
      required : [true, 'Message is required'],
      trim     : true,
      minlength: [10,   'Message must be at least 10 characters'],
      maxlength: [3000, 'Message cannot exceed 3000 characters'],
    },
    collaboration: {
      type   : Boolean,
      default: false,
    },
    status: {
      type   : String,
      enum   : ['unread', 'read', 'replied', 'archived', 'spam'],
      default: 'unread',
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    repliedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1 });

module.exports = mongoose.model('Contact', contactSchema);