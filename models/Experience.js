

'use strict';

const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    role: {
      type     : String,
      required : [true, 'Role/position is required'],
      trim     : true,
      maxlength: [100, 'Role cannot exceed 100 characters'],
    },
    company: {
      type     : String,
      required : [true, 'Company name is required'],
      trim     : true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    companyUrl: {
      type: String,
      trim: true,
    },
    companyLogo: {
      type: String,
      trim: true,
    },
    location: {
      type   : String,
      trim   : true,
      default: 'Nairobi, Kenya',
    },
    employmentType: {
      type   : String,
      enum   : ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
      default: 'Full-time',
    },
    startDate: {
      type    : Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date, // null = current job
    },
    isCurrent: {
      type   : Boolean,
      default: false,
    },
    duration: {
      type: String, // e.g. "Jan 2023 – Present"
      trim: true,
    },
    responsibilities: {
      type    : [String],
      default : [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message  : 'Max 10 responsibilities',
      },
    },
    technologies: {
      type   : [String],
      default: [],
    },
    achievements: {
      type   : [String],
      default: [],
    },
    visible: {
      type   : Boolean,
      default: true,
    },
    order: {
      type   : Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// ── Virtual: formatted duration ────────────────────────────
experienceSchema.virtual('formattedDuration').get(function () {
  if (this.duration) return this.duration;
  const start  = this.startDate?.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const end    = this.isCurrent ? 'Present' : this.endDate?.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  return `${start} – ${end}`;
});

// ── Indexes ────────────────────────────────────────────────
experienceSchema.index({ order: 1 });
experienceSchema.index({ startDate: -1 });
experienceSchema.index({ visible: 1 });

module.exports = mongoose.model('Experience', experienceSchema);