const Destination = require('../models/Destination');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all active destinations (search and filter by country)
 * @route   GET /api/admin/destinations (also accessible by users/admin)
 * @access  Protected
 */
const getDestinations = asyncHandler(async (req, res, next) => {
  const { search, country } = req.query;
  const filter = { isActive: true };

  if (country) {
    filter.country = { $regex: country, $options: 'i' };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const destinations = await Destination.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: destinations,
    message: 'Destinations retrieved successfully',
  });
});

/**
 * @desc    Create a new destination (Admin only)
 * @route   POST /api/admin/destinations
 * @access  Protected / Admin
 */
const createDestination = asyncHandler(async (req, res, next) => {
  const {
    name,
    country,
    description,
    imageUrl,
    popularAttractions,
    bestTimeToVisit,
    averageBudget,
    currency,
    tags,
    partnerships,
  } = req.body;

  const existing = await Destination.findOne({ name });
  if (existing) {
    throw new ApiError(400, `Destination '${name}' already exists`);
  }

  const destination = await Destination.create({
    name,
    country,
    description: description || '',
    imageUrl: imageUrl || '',
    popularAttractions: popularAttractions || [],
    bestTimeToVisit: bestTimeToVisit || '',
    averageBudget: averageBudget || 0,
    currency: currency || 'INR',
    tags: tags || [],
    partnerships: partnerships || [],
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: destination,
    message: 'Destination created successfully',
  });
});

/**
 * @desc    Get destination by ID
 * @route   GET /api/admin/destinations/:id
 * @access  Protected
 */
const getDestinationById = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    throw new ApiError(404, 'Destination not found');
  }

  res.status(200).json({
    success: true,
    data: destination,
    message: 'Destination retrieved successfully',
  });
});

/**
 * @desc    Update destination and partnerships (Admin only)
 * @route   PUT /api/admin/destinations/:id
 * @access  Protected / Admin
 */
const updateDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    throw new ApiError(404, 'Destination not found');
  }

  delete req.body.createdBy;

  const updatedDestination = await Destination.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedDestination,
    message: 'Destination updated successfully',
  });
});

/**
 * @desc    Delete destination (Admin only)
 * @route   DELETE /api/admin/destinations/:id
 * @access  Protected / Admin
 */
const deleteDestination = asyncHandler(async (req, res, next) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    throw new ApiError(404, 'Destination not found');
  }

  await destination.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Destination deleted successfully',
  });
});

module.exports = {
  getDestinations,
  createDestination,
  getDestinationById,
  updateDestination,
  deleteDestination,
};
