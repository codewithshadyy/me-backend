/**
 * models/Project.js
 * Portfolio project model
 */

'use strict';

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type     : String,
      required : [true, 'Project title is required'],
      trim     : true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type  : String,
      unique: true,
      trim  : true,
    },
    description: {
      type     : String,
      required : [true, 'Project description is required'],
      trim     : true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type     : String,
      trim     : true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    category: {
      type    : String,
      required: [true, 'Category is required'],
      enum    : ['api', 'backend', 'fullstack', 'database', 'devops', 'other'],
      default : 'backend',
    },
    techStack: {
      type   : [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 15,
        message  : 'Tech stack cannot have more than 15 items',
      },
    },
    tags: {
      type   : [String],
      default: [],
    },
    images: {
      type   : [String], // array of image URLs / paths
      default: [],
    },
    imageUrl: {
      type   : String, // primary/featured image
      default: '',
    },
    githubLink: {
      type : String,
      trim : true,
      match: [/^https?:\/\/.+/, 'GitHub link must be a valid URL'],
    },
    liveLink: {
      type : String,
      trim : true,
      match: [/^https?:\/\/.+/, 'Live link must be a valid URL'],
    },
    featured: {
      type   : Boolean,
      default: false,
    },
    visible: {
      type   : Boolean,
      default: true,
    },
    order: {
      type   : Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    metrics: {
      stars    : { type: Number, default: 0 },
      forks    : { type: Number, default: 0 },
      views    : { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────

projectSchema.index({ category: 1, visible: 1 });
projectSchema.index({ featured: 1, visible: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

// ── Pre-save: Generate slug ────────────────────────────────
projectSchema.pre('save', async function () {
  if (!this.isModified('title') && this.slug) return next();

  const base = this.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  let slug  = base;
  let count = 0;
  while (await mongoose.model('Project').findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${++count}`;
  }
  this.slug = slug;

  // Auto-set shortDescription if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.slice(0, 200) + (this.description.length > 200 ? '...' : '');
  }

  // Primary image = first image in array
  if (this.images.length > 0 && !this.imageUrl) {
    this.imageUrl = this.images[0];
  }

  
});

module.exports = mongoose.model('Project', projectSchema);