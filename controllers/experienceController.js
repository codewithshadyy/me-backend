



const Experience = require('../models/Experience');
const { asyncHandler, ApiError } = require('../middlewares/errorHandler');

// GET /api/experiences — Public
const getExperiences = asyncHandler(async (req, res) => {
  const { visible = 'true', sort = '-startDate' } = req.query;
  const filter = visible === 'true' ? { visible: true } : {};

  const experiences = await Experience.find(filter).sort(sort).lean();
  res.json({ success: true, count: experiences.length, experiences });
});

// GET /api/experiences/:id — Public
const getExperience = asyncHandler(async (req, res) => {
  const exp = await Experience.findById(req.params.id);
  if (!exp) throw new ApiError('Experience not found', 404);
  res.json({ success: true, experience: exp });
});

// POST /api/experiences — Private (Admin)
const createExperience = asyncHandler(async (req, res) => {
  const {
    role, company, companyUrl, location, employmentType,
    startDate, endDate, isCurrent, duration,
    responsibilities, technologies, achievements,
    visible, order,
  } = req.body;

  const exp = await Experience.create({
    role, company, companyUrl, location, employmentType,
    startDate, endDate, isCurrent: isCurrent === true || isCurrent === 'true',
    duration, responsibilities, technologies, achievements,
    visible: visible !== false && visible !== 'false',
    order: Number(order) || 0,
  });

  res.status(201).json({
    success   : true,
    message   : 'Experience created',
    experience: exp,
  });
});

// PUT /api/experiences/:id — Private (Admin)
const updateExperience = asyncHandler(async (req, res) => {
  const exp = await Experience.findById(req.params.id);
  if (!exp) throw new ApiError('Experience not found', 404);

  const fields = [
    'role', 'company', 'companyUrl', 'location', 'employmentType',
    'startDate', 'endDate', 'duration', 'responsibilities',
    'technologies', 'achievements', 'visible', 'order',
  ];

  fields.forEach(f => {
    if (req.body[f] !== undefined) exp[f] = req.body[f];
  });

  if (req.body.isCurrent !== undefined) {
    exp.isCurrent = req.body.isCurrent === true || req.body.isCurrent === 'true';
    if (exp.isCurrent) exp.endDate = undefined;
  }

  await exp.save();
  res.json({ success: true, message: 'Experience updated', experience: exp });
});

// DELETE /api/experiences/:id — Private (Admin)
const deleteExperience = asyncHandler(async (req, res) => {
  const exp = await Experience.findById(req.params.id);
  if (!exp) throw new ApiError('Experience not found', 404);
  await exp.deleteOne();
  res.json({ success: true, message: 'Experience deleted' });
});

// PATCH /api/experiences/:id/toggle-visible — Private
const toggleVisible = asyncHandler(async (req, res) => {
  const exp = await Experience.findById(req.params.id);
  if (!exp) throw new ApiError('Experience not found', 404);
  exp.visible = !exp.visible;
  await exp.save();
  res.json({ success: true, visible: exp.visible, message: `Experience ${exp.visible ? 'shown' : 'hidden'}` });
});

// PATCH /api/experiences/reorder — Private (bulk reorder)
const reorderExperiences = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{ id, order }]
  if (!Array.isArray(order)) throw new ApiError('order must be an array', 400);

  await Promise.all(
    order.map(({ id, order: o }) =>
      Experience.findByIdAndUpdate(id, { order: Number(o) })
    )
  );
  res.json({ success: true, message: 'Experiences reordered' });
});

module.exports = {
  getExperiences, getExperience,
  createExperience, updateExperience, deleteExperience,
  toggleVisible, reorderExperiences,
};