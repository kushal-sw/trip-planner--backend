const Destination = require('../models/Destination');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getWeatherData } = require('../utils/weatherApi');

/**
 * @desc    Get weather for city/destination query
 * @route   GET /api/weather
 * @access  Protected
 */
const getWeather = asyncHandler(async (req, res, next) => {
  const destination = req.query.city || req.query.destination || 'Paris';
  const weather = await getWeatherData(destination);

  res.status(200).json({
    success: true,
    data: weather,
    message: 'Weather retrieved successfully',
  });
});

/**
 * @desc    Get weather by destination ID
 * @route   GET /api/weather/destination/:id
 * @access  Protected
 */
const getWeatherByDestination = asyncHandler(async (req, res, next) => {
  const destinationId = req.params.id;

  const destination = await Destination.findById(destinationId);
  if (!destination) {
    throw new ApiError(404, 'Destination not found');
  }

  const weather = await getWeatherData(destination.name);

  res.status(200).json({
    success: true,
    data: weather,
    message: 'Destination weather retrieved successfully',
  });
});

module.exports = {
  getWeather,
  getWeatherByDestination,
};
