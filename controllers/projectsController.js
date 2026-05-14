

'use strict';

const Project               = require('../models/Project');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { buildFileUrl, deleteFile } = require('../middleware/upload');

// ─────────────────────────────────────────────────────────
// @route   GET /api/projects
// @desc    Get all visible projects (public)
// @access  Public
// ─────────────────────────────────────────────────────────
const getProjects = asyncHandler(async (req, res) => {
  const {
    page     = 1,
    limit    = 20,
    category,
    featured,
    search,
    sort     = '-createdAt',
    tags,
  } = req.query;

  const filter = { visible: true };

  if (category && category !== 'all') filter.category = category;
  if (featured === 'true')             filter.featured  = true;
  if (tags)                            filter.tags = { $in: tags.split(',') };

  // Full-text search
  if (search) {
    filter.$text = { $search: search };
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Project.countDocuments(filter);

  const projects = await Project
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.json({
    success: true,
    count  : projects.length,
    total,
    page   : Number(page),
    pages  : Math.ceil(total / Number(limit)),
    projects,
  });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/projects/all
// @desc    Get all projects including hidden (admin)
// @access  Private
// ─────────────────────────────────────────────────────────
const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, sort = '-createdAt' } = req.query;
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Project.countDocuments();

  const projects = await Project
    .find()
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.json({
    success: true,
    count  : projects.length,
    total,
    page   : Number(page),
    pages  : Math.ceil(total / Number(limit)),
    projects,
  });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/projects/:id
// @desc    Get single project by ID or slug
// @access  Public
// ─────────────────────────────────────────────────────────
const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query  = id.match(/^[a-f\d]{24}$/i)
    ? { _id: id }
    : { slug: id };

  const project = await Project.findOne({ ...query, visible: true });
  if (!project) throw new ApiError('Project not found', 404);

  // Increment views
  project.metrics.views += 1;
  await project.save();

  res.json({ success: true, project });
});

// ─────────────────────────────────────────────────────────
// @route   POST /api/projects
// @desc    Create new project
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────
const createProject = asyncHandler(async (req, res) => {
  const {
    title, description, shortDescription, category,
    techStack, tags, githubLink, liveLink,
    featured, visible, order, completedAt,
    imageUrl, images,
  } = req.body;

  // Handle uploaded images (from multer)
  let uploadedImages = [];
  if (req.files?.length) {
    uploadedImages = req.files.map(f => buildFileUrl(req, f.path));
  }

  // Merge with any image URLs sent as JSON
  const allImages = [
    ...(Array.isArray(images) ? images : []),
    ...uploadedImages,
  ].filter(Boolean);

  const project = await Project.create({
    title, description, shortDescription, category,
    techStack: Array.isArray(techStack) ? techStack : techStack?.split(',').map(s => s.trim()),
    tags     : Array.isArray(tags) ? tags : tags?.split(',').map(s => s.trim()),
    githubLink, liveLink,
    featured : featured === 'true' || featured === true,
    visible  : visible  === 'false' || visible === false ? false : true,
    order    : Number(order) || 0,
    completedAt,
    imageUrl : imageUrl || allImages[0] || '',
    images   : allImages,
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project,
  });
});

// ─────────────────────────────────────────────────────────
// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError('Project not found', 404);

  const {
    title, description, shortDescription, category,
    techStack, tags, githubLink, liveLink,
    featured, visible, order, completedAt, imageUrl, images,
  } = req.body;

  // Handle newly uploaded files
  let uploadedImages = [];
  if (req.files?.length) {
    uploadedImages = req.files.map(f => buildFileUrl(req, f.path));
  }

  const allImages = [
    ...(Array.isArray(images) ? images : images ? [images] : project.images),
    ...uploadedImages,
  ].filter(Boolean);

  // Apply updates
  if (title)            project.title = title;
  if (description)      project.description = description;
  if (shortDescription) project.shortDescription = shortDescription;
  if (category)         project.category = category;
  if (techStack)        project.techStack = Array.isArray(techStack) ? techStack : techStack.split(',').map(s => s.trim());
  if (tags)             project.tags = Array.isArray(tags) ? tags : tags.split(',').map(s => s.trim());
  if (githubLink !== undefined) project.githubLink = githubLink;
  if (liveLink  !== undefined)  project.liveLink   = liveLink;
  if (featured  !== undefined)  project.featured   = featured === 'true' || featured === true;
  if (visible   !== undefined)  project.visible    = visible  !== 'false' && visible !== false;
  if (order     !== undefined)  project.order      = Number(order);
  if (completedAt)              project.completedAt = completedAt;
  if (imageUrl)                 project.imageUrl = imageUrl;
  if (allImages.length)         project.images   = allImages;

  // Auto-set primary image
  if (project.images.length > 0 && !project.imageUrl) {
    project.imageUrl = project.images[0];
  }

  await project.save();
  res.json({ success: true, message: 'Project updated', project });
});

// ─────────────────────────────────────────────────────────
// @route   DELETE /api/projects/:id
// @desc    Delete project (and its uploaded images)
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError('Project not found', 404);

  // Delete associated local images
  project.images.forEach(imgUrl => {
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
      const rel = imgUrl.split('/uploads/')[1];
      if (rel) deleteFile(rel);
    }
  });

  await project.deleteOne();
  res.json({ success: true, message: 'Project deleted successfully' });
});

// ─────────────────────────────────────────────────────────
// @route   PATCH /api/projects/:id/toggle-featured
// @desc    Toggle featured status
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────
const toggleFeatured = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError('Project not found', 404);

  project.featured = !project.featured;
  await project.save();

  res.json({
    success : true,
    message : `Project ${project.featured ? 'marked as' : 'removed from'} featured`,
    featured: project.featured,
  });
});

// ─────────────────────────────────────────────────────────
// @route   PATCH /api/projects/:id/toggle-visible
// @desc    Toggle visibility
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────
const toggleVisible = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError('Project not found', 404);

  project.visible = !project.visible;
  await project.save();

  res.json({
    success: true,
    message: `Project ${project.visible ? 'published' : 'hidden'}`,
    visible: project.visible,
  });
});

// ─────────────────────────────────────────────────────────
// @route   GET /api/projects/categories
// @desc    Get all unique categories
// @access  Public
// ─────────────────────────────────────────────────────────
const getCategories = asyncHandler(async (_req, res) => {
  const cats = await Project.distinct('category', { visible: true });
  res.json({ success: true, categories: cats });
});

module.exports = {
  getProjects, getAllProjects, getProject,
  createProject, updateProject, deleteProject,
  toggleFeatured, toggleVisible, getCategories,
};