const Trip = require('../models/Trip');
const Itinerary = require('../models/Itinerary');
const Activity = require('../models/Activity');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const Share = require('../models/Share');
const PhotoJournal = require('../models/PhotoJournal');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessTrip, canEditTrip } = require('../utils/canAccessTrip');

/**
 * @desc    Create a new trip
 * @route   POST /api/trips
 * @access  Protected
 */
const createTrip = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    destination,
    startDate,
    endDate,
    coverImage,
    budget,
    currency,
    status,
    tags,
    isPublic,
  } = req.body;

  const trip = await Trip.create({
    title,
    description,
    destination,
    startDate,
    endDate,
    coverImage,
    budget,
    currency: currency || 'INR',
    status: status || 'planning',
    tags: tags || [],
    isPublic: isPublic || false,
    userId: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: trip,
    message: 'Trip created successfully',
  });
});

/**
 * @desc    Get all trips user owns or is shared on (with pagination)
 * @route   GET /api/trips
 * @access  Protected
 */
const getAllTrips = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Find trips shared with the user
  const shares = await Share.find({ sharedWith: req.user._id }).select('tripId');
  const sharedTripIds = shares.map((s) => s.tripId);

  const query = {
    $or: [{ userId: req.user._id }, { _id: { $in: sharedTripIds } }],
  };

  const total = await Trip.countDocuments(query);
  const trips = await Trip.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email avatar');

  res.status(200).json({
    success: true,
    data: {
      trips,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    },
    message: 'Trips retrieved successfully',
  });
});

/**
 * @desc    Get single trip by ID (with authorization check)
 * @route   GET /api/trips/:id
 * @access  Protected
 */
const getTripById = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id).populate('userId', 'name email avatar');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, trip._id);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view this trip');
  }

  res.status(200).json({
    success: true,
    data: trip,
    message: 'Trip retrieved successfully',
  });
});

/**
 * @desc    Update a trip (owner or edit permission)
 * @route   PUT /api/trips/:id
 * @access  Protected
 */
const updateTrip = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasEditAccess = await canEditTrip(req.user._id, trip._id);
  if (!hasEditAccess) {
    throw new ApiError(403, 'You do not have permission to edit this trip');
  }

  // Prevent transferring ownership via body
  delete req.body.userId;

  const updatedTrip = await Trip.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('userId', 'name email avatar');

  res.status(200).json({
    success: true,
    data: updatedTrip,
    message: 'Trip updated successfully',
  });
});

/**
 * @desc    Delete a trip (ownership only) with cascade delete
 * @route   DELETE /api/trips/:id
 * @access  Protected
 */
const deleteTrip = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Ensure ownership only (not just edit permission)
  if (trip.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the trip owner can delete this trip');
  }

  // Cascade delete related entities
  // 1. Find itineraries to cascade delete their activities
  const itineraries = await Itinerary.find({ tripId: trip._id }).select('_id');
  const itineraryIds = itineraries.map((i) => i._id);

  await Activity.deleteMany({ itineraryId: { $in: itineraryIds } });
  await Itinerary.deleteMany({ tripId: trip._id });
  await Booking.deleteMany({ tripId: trip._id });
  await Expense.deleteMany({ tripId: trip._id });
  await Share.deleteMany({ tripId: trip._id });
  await PhotoJournal.deleteMany({ tripId: trip._id });

  // Delete trip itself
  await Trip.findByIdAndDelete(trip._id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Trip and all associated resources deleted successfully',
  });
});

/**
 * @desc    Get offline trip bundle with itineraries, activities, bookings, and expenses
 * @route   GET /api/trips/:id/offline
 * @access  Protected
 */
const getTripOfflineBundle = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.id).populate('userId', 'name email avatar');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, trip._id);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to access this trip');
  }

  // 1. Fetch itineraries and their activities
  const itineraries = await Itinerary.find({ tripId: trip._id }).sort({ dayNumber: 1 });
  const itineraryIds = itineraries.map((i) => i._id);
  const activities = await Activity.find({ itineraryId: { $in: itineraryIds } }).sort({ startTime: 1 });

  const itinerariesWithActivities = itineraries.map((itinerary) => {
    const itObj = itinerary.toObject();
    itObj.activities = activities.filter(
      (a) => a.itineraryId.toString() === itinerary._id.toString()
    );
    return itObj;
  });

  // 2. Fetch bookings
  const bookings = await Booking.find({ tripId: trip._id }).sort({ createdAt: -1 });

  // 3. Fetch expenses + sum total
  const expenses = await Expense.find({ tripId: trip._id }).sort({ date: -1 });
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 4. Fetch photos
  const photos = await PhotoJournal.find({ tripId: trip._id }).sort({ takenAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      trip,
      itineraries: itinerariesWithActivities,
      bookings,
      expenses: {
        items: expenses,
        total: totalExpenses,
      },
      photos,
    },
    message: 'Offline trip data bundle generated successfully',
  });
});

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripOfflineBundle,
};

