const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessTrip, canEditTrip } = require('../utils/canAccessTrip');

/**
 * @desc    Create an itinerary for a trip
 * @route   POST /api/itineraries
 * @access  Protected
 */
const createItinerary = asyncHandler(async (req, res, next) => {
  const { tripId, dayNumber, date, title, notes, transport } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasEdit = await canEditTrip(req.user._id, tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to add itineraries to this trip');
  }

  const itinerary = await Itinerary.create({
    tripId,
    dayNumber,
    date,
    title,
    notes: notes || '',
    transport: transport || {},
    userId: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: itinerary,
    message: 'Itinerary created successfully',
  });
});

/**
 * @desc    Get all itineraries for trips user can access
 * @route   GET /api/itineraries
 * @access  Protected
 */
const getAllItineraries = asyncHandler(async (req, res, next) => {
  // Find all trips accessible by the user
  const allTrips = await Trip.find({});
  const accessibleTripIds = [];

  for (const trip of allTrips) {
    if (await canAccessTrip(req.user._id, trip._id)) {
      accessibleTripIds.push(trip._id);
    }
  }

  const itineraries = await Itinerary.find({ tripId: { $in: accessibleTripIds } })
    .sort({ tripId: 1, dayNumber: 1 });

  res.status(200).json({
    success: true,
    data: itineraries,
    message: 'Itineraries retrieved successfully',
  });
});

/**
 * @desc    Get itineraries by trip ID (sorted by dayNumber)
 * @route   GET /api/itineraries/trip/:id
 * @access  Protected
 */
const getItinerariesByTrip = asyncHandler(async (req, res, next) => {
  const tripId = req.params.id;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view itineraries for this trip');
  }

  const itineraries = await Itinerary.find({ tripId }).sort({ dayNumber: 1 });

  res.status(200).json({
    success: true,
    data: itineraries,
    message: 'Trip itineraries retrieved successfully',
  });
});

/**
 * @desc    Get single itinerary by ID
 * @route   GET /api/itineraries/:id
 * @access  Protected
 */
const getItineraryById = asyncHandler(async (req, res, next) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, itinerary.tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view this itinerary');
  }

  const activities = await Activity.find({ itineraryId: itinerary._id }).sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    data: {
      ...itinerary.toObject(),
      activities,
    },
    message: 'Itinerary retrieved successfully',
  });
});

/**
 * @desc    Update an itinerary
 * @route   PUT /api/itineraries/:id
 * @access  Protected
 */
const updateItinerary = asyncHandler(async (req, res, next) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary not found');
  }

  const hasEdit = await canEditTrip(req.user._id, itinerary.tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to edit this itinerary');
  }

  delete req.body.tripId;
  delete req.body.userId;

  const updatedItinerary = await Itinerary.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedItinerary,
    message: 'Itinerary updated successfully',
  });
});

/**
 * @desc    Delete an itinerary (and cascade delete its activities)
 * @route   DELETE /api/itineraries/:id
 * @access  Protected
 */
const deleteItinerary = asyncHandler(async (req, res, next) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary not found');
  }

  const hasEdit = await canEditTrip(req.user._id, itinerary.tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to delete this itinerary');
  }

  // Delete all child activities
  await Activity.deleteMany({ itineraryId: itinerary._id });

  // Delete the itinerary
  await itinerary.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Itinerary and its activities deleted successfully',
  });
});

module.exports = {
  createItinerary,
  getAllItineraries,
  getItinerariesByTrip,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
};
