const Activity = require('../models/Activity');
const Itinerary = require('../models/Itinerary');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessTrip, canEditTrip } = require('../utils/canAccessTrip');

/**
 * @desc    Create an activity under an itinerary
 * @route   POST /api/activities
 * @access  Protected
 */
const createActivity = asyncHandler(async (req, res, next) => {
  const {
    itineraryId,
    name,
    description,
    type,
    location,
    startTime,
    endTime,
    cost,
    currency,
    notes,
  } = req.body;

  const itinerary = await Itinerary.findById(itineraryId);
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary not found');
  }

  const hasEdit = await canEditTrip(req.user._id, itinerary.tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to add activities to this trip');
  }

  const activity = await Activity.create({
    itineraryId,
    name,
    description: description || '',
    type: type || 'sightseeing',
    location: location || {},
    startTime: startTime || '',
    endTime: endTime || '',
    cost: cost || 0,
    currency: currency || 'INR',
    notes: notes || '',
    userId: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: activity,
    message: 'Activity created successfully',
  });
});

/**
 * @desc    Get all activities created by the current user
 * @route   GET /api/activities
 * @access  Protected
 */
const getAllActivities = asyncHandler(async (req, res, next) => {
  const activities = await Activity.find({ userId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: activities,
    message: 'Activities retrieved successfully',
  });
});

/**
 * @desc    Get activities for an itinerary (sorted by startTime)
 * @route   GET /api/activities/itinerary/:id
 * @access  Protected
 */
const getActivitiesByItinerary = asyncHandler(async (req, res, next) => {
  const itinerary = await Itinerary.findById(req.params.id);
  if (!itinerary) {
    throw new ApiError(404, 'Itinerary not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, itinerary.tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view activities for this trip');
  }

  const activities = await Activity.find({ itineraryId: itinerary._id }).sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    data: activities,
    message: 'Itinerary activities retrieved successfully',
  });
});

/**
 * @desc    Get single activity by ID
 * @route   GET /api/activities/:id
 * @access  Protected
 */
const getActivityById = asyncHandler(async (req, res, next) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  const itinerary = await Itinerary.findById(activity.itineraryId);
  if (itinerary) {
    const hasAccess = await canAccessTrip(req.user._id, itinerary.tripId);
    if (!hasAccess) {
      throw new ApiError(403, 'You do not have permission to view this activity');
    }
  }

  res.status(200).json({
    success: true,
    data: activity,
    message: 'Activity retrieved successfully',
  });
});

/**
 * @desc    Update an activity
 * @route   PUT /api/activities/:id
 * @access  Protected
 */
const updateActivity = asyncHandler(async (req, res, next) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  const itinerary = await Itinerary.findById(activity.itineraryId);
  if (itinerary) {
    const hasEdit = await canEditTrip(req.user._id, itinerary.tripId);
    if (!hasEdit) {
      throw new ApiError(403, 'You do not have permission to edit this activity');
    }
  }

  delete req.body.itineraryId;
  delete req.body.userId;

  const updatedActivity = await Activity.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: updatedActivity,
    message: 'Activity updated successfully',
  });
});

/**
 * @desc    Delete an activity
 * @route   DELETE /api/activities/:id
 * @access  Protected
 */
const deleteActivity = asyncHandler(async (req, res, next) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  const itinerary = await Itinerary.findById(activity.itineraryId);
  if (itinerary) {
    const hasEdit = await canEditTrip(req.user._id, itinerary.tripId);
    if (!hasEdit) {
      throw new ApiError(403, 'You do not have permission to delete this activity');
    }
  }

  await activity.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Activity deleted successfully',
  });
});

module.exports = {
  createActivity,
  getAllActivities,
  getActivitiesByItinerary,
  getActivityById,
  updateActivity,
  deleteActivity,
};
