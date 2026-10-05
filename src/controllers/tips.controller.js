const Tip = require('../models/Tip');
const Destination = require('../models/Destination');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all tips with pagination
 * @route   GET /api/tips
 * @access  Protected
 */
const getAllTips = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const total = await Tip.countDocuments();
  const tips = await Tip.find()
    .skip(skip)
    .limit(limit)
    .populate('destinationId', 'name country');

  res.status(200).json({
    success: true,
    data: {
      tips,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    },
    message: 'Tips retrieved successfully',
  });
});

/**
 * @desc    Get tips by destination ID
 * @route   GET /api/tips/destination/:id
 * @access  Protected
 */
const getTipsByDestination = asyncHandler(async (req, res, next) => {
  const destinationId = req.params.id;

  const destination = await Destination.findById(destinationId);
  if (!destination) {
    throw new ApiError(404, 'Destination not found');
  }

  const tips = await Tip.find({ destinationId }).sort({ category: 1 });

  res.status(200).json({
    success: true,
    data: tips,
    message: 'Destination tips retrieved successfully',
  });
});

module.exports = {
  getAllTips,
  getTipsByDestination,
};
