const Trip = require('../models/Trip');
const Share = require('../models/Share');

/**
 * Check if a user can access (view) a trip.
 * User can access if:
 * 1. User is the trip owner
 * 2. User has a Share record for the trip (either 'view' or 'edit')
 * 3. Trip is marked as isPublic (for view access)
 */
const canAccessTrip = async (userId, tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return false;
  }

  // Owner check
  if (trip.userId.toString() === userId.toString()) {
    return true;
  }

  // Public trip check
  if (trip.isPublic) {
    return true;
  }

  // Share check
  const share = await Share.findOne({
    tripId,
    sharedWith: userId,
  });

  return !!share;
};

/**
 * Check if a user can edit a trip.
 * User can edit if:
 * 1. User is the trip owner
 * 2. User has a Share record for the trip with permission === 'edit'
 */
const canEditTrip = async (userId, tripId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    return false;
  }

  // Owner check
  if (trip.userId.toString() === userId.toString()) {
    return true;
  }

  // Share check with edit permission
  const share = await Share.findOne({
    tripId,
    sharedWith: userId,
    permission: 'edit',
  });

  return !!share;
};

module.exports = {
  canAccessTrip,
  canEditTrip,
};
