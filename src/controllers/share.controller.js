const Share = require('../models/Share');
const Trip = require('../models/Trip');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const notifyUser = require('../utils/notifyUser');

/**
 * @desc    Share trip with users by email
 * @route   POST /api/share
 * @access  Protected
 */
const shareTrip = asyncHandler(async (req, res, next) => {
  const { tripId, emails, permission } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Ensure requester is the owner of the trip
  if (trip.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the trip owner can share this trip');
  }

  const emailList = Array.isArray(emails) ? emails : [emails];
  const createdShares = [];

  // Validate all emails first
  for (const email of emailList) {
    const targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!targetUser) {
      throw new ApiError(404, `User with email ${email} is not registered`);
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, 'You cannot share a trip with yourself');
    }

    // Upsert share record (update permission if already exists)
    const share = await Share.findOneAndUpdate(
      { tripId: trip._id, sharedWith: targetUser._id },
      {
        tripId: trip._id,
        sharedBy: req.user._id,
        sharedWith: targetUser._id,
        permission: permission || 'view',
        sharedAt: new Date(),
      },
      { upsert: true, new: true }
    ).populate('sharedWith', 'name email avatar');

    createdShares.push(share);

    // Trigger fail-silent notification to shared user
    try {
      await notifyUser(targetUser._id, {
        title: 'Trip Shared With You',
        body: `${req.user.name} shared the trip "${trip.title}" with you (${permission || 'view'} access)`,
        type: 'trip_shared',
        data: {
          tripId: trip._id.toString(),
          tripTitle: trip.title,
          sharedBy: req.user.name,
          permission: permission || 'view',
        },
      });
    } catch (notifErr) {
      console.warn(`⚠️ Share notification failed: ${notifErr.message}`);
    }
  }

  res.status(201).json({
    success: true,
    data: createdShares,
    message: 'Trip shared successfully',
  });
});

/**
 * @desc    Get all users a trip is shared with
 * @route   GET /api/share/trip/:id
 * @access  Protected
 */
const getSharesByTrip = asyncHandler(async (req, res, next) => {
  const tripId = req.params.id;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Requester must be owner or have access
  const isOwner = trip.userId.toString() === req.user._id.toString();
  const isShared = await Share.findOne({ tripId, sharedWith: req.user._id });

  if (!isOwner && !isShared) {
    throw new ApiError(403, 'You do not have permission to view shares for this trip');
  }

  const shares = await Share.find({ tripId })
    .populate('sharedWith', 'name email avatar')
    .populate('sharedBy', 'name email');

  res.status(200).json({
    success: true,
    data: shares,
    message: 'Trip shares retrieved successfully',
  });
});

/**
 * @desc    Revoke/remove trip share access
 * @route   DELETE /api/share/:id
 * @access  Protected
 */
const revokeShare = asyncHandler(async (req, res, next) => {
  const share = await Share.findById(req.params.id);
  if (!share) {
    throw new ApiError(404, 'Share record not found');
  }

  const trip = await Trip.findById(share.tripId);
  const isOwner = trip && trip.userId.toString() === req.user._id.toString();
  const isSelf = share.sharedWith.toString() === req.user._id.toString();

  if (!isOwner && !isSelf) {
    throw new ApiError(403, 'You do not have permission to revoke this share');
  }

  await share.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Trip share access revoked successfully',
  });
});

module.exports = {
  shareTrip,
  getSharesByTrip,
  revokeShare,
};
