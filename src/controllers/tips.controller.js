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

  let tips = await Tip.find({ destinationId }).sort({ category: 1 });

  // If no tips exist yet and Gemini is configured, dynamically generate them!
  if (tips.length === 0 && process.env.GEMINI_API_KEY) {
    const { getGeminiLocalTips } = require('../utils/geminiService');
    const aiTips = await getGeminiLocalTips(destination.name);
    if (aiTips && aiTips.length > 0) {
      const created = await Tip.create(
        aiTips.map((t) => ({
          destinationId: destination._id,
          category: t.category,
          text: t.text,
        }))
      );
      tips = created;
    }
  }

  res.status(200).json({
    success: true,
    data: tips,
    message: 'Destination tips retrieved successfully',
  });
});

/**
 * @desc    Generate real-time AI local tips using Google Gemini
 * @route   GET /api/tips/ai
 * @access  Protected
 */
const getAiTips = asyncHandler(async (req, res, next) => {
  const destination = req.query.destination || req.query.city || 'Paris';
  const { getGeminiLocalTips } = require('../utils/geminiService');

  let tips = null;
  if (process.env.GEMINI_API_KEY) {
    tips = await getGeminiLocalTips(destination);
  }

  // Fallback if no Gemini key or error
  if (!tips || tips.length === 0) {
    tips = [
      { destination, category: 'safety', text: 'Keep copies of passports and stay vigilant around crowded tourist hotspots.' },
      { destination, category: 'food', text: 'Seek out neighborhood bistros located two blocks off major tourist avenues for authentic flavors.' },
      { destination, category: 'transport', text: 'Download the local municipal metro/bus app for contactless mobile ticket purchasing.' },
      { destination, category: 'culture', text: 'Learn basic local greetings (Hello, Please, Thank You) to show respect to local shopkeepers.' },
    ];
  }

  res.status(200).json({
    success: true,
    data: {
      destination,
      aiPowered: !!process.env.GEMINI_API_KEY,
      tips,
    },
    message: 'AI local travel tips retrieved successfully',
  });
});

module.exports = {
  getAllTips,
  getTipsByDestination,
  getAiTips,
};
