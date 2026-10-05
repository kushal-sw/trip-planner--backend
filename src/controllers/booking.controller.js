const crypto = require('crypto');
const Booking = require('../models/Booking');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { canAccessTrip, canEditTrip } = require('../utils/canAccessTrip');
const { generateFlights, generateHotels } = require('../utils/mockData');
const notifyUser = require('../utils/notifyUser');

/**
 * @desc    Search mock flights (no DB storage)
 * @route   GET /api/flights
 * @access  Protected
 */
const searchFlights = asyncHandler(async (req, res, next) => {
  const { from, to, date } = req.query;
  const flights = generateFlights(from, to, date);

  res.status(200).json({
    success: true,
    data: flights,
    message: 'Flights searched successfully',
  });
});

/**
 * @desc    Search mock hotels (no DB storage)
 * @route   GET /api/hotels
 * @access  Protected
 */
const searchHotels = asyncHandler(async (req, res, next) => {
  const { destination, checkIn, checkOut } = req.query;
  const hotels = generateHotels(destination, checkIn, checkOut);

  res.status(200).json({
    success: true,
    data: hotels,
    message: 'Hotels searched successfully',
  });
});

/**
 * @desc    Create a booking (flight or hotel), auto-create matching expense & send notification
 * @route   POST /api/bookings
 * @access  Protected
 */
const createBooking = asyncHandler(async (req, res, next) => {
  const { tripId, type, details, totalAmount, currency } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Check if user has permission to edit the trip
  const hasEdit = await canEditTrip(req.user._id, tripId);
  if (!hasEdit) {
    throw new ApiError(403, 'You do not have permission to book for this trip');
  }

  // Generate unique booking reference: e.g. BK-FL-9A3F12
  const prefix = type === 'flight' ? 'BK-FL' : 'BK-HT';
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const bookingRef = `${prefix}-${Date.now().toString().slice(-4)}${randomSuffix}`;

  // 1. Create Booking
  const booking = await Booking.create({
    userId: req.user._id,
    tripId,
    type,
    bookingRef,
    status: 'confirmed',
    totalAmount,
    currency: currency || 'INR',
    details,
  });

  // 2. Auto-create matching Expense
  const expenseCategory = type === 'hotel' ? 'accommodation' : 'transport';
  const description =
    type === 'hotel'
      ? `Booking: ${details.name || 'Hotel Accommodation'}`
      : `Booking: ${details.airline || 'Flight'} (${details.flightNumber || 'Flight'})`;

  await Expense.create({
    tripId,
    userId: req.user._id,
    category: expenseCategory,
    description,
    amount: totalAmount,
    currency: currency || 'INR',
    date: new Date(),
    bookingRef,
  });

  // 3. Trigger fail-silent notification
  try {
    await notifyUser(req.user._id, {
      title: 'Booking Confirmed',
      body: `Your ${type} booking (${bookingRef}) has been confirmed!`,
      type: 'booking_confirmed',
      data: {
        bookingId: booking._id.toString(),
        bookingRef,
        tripId: tripId.toString(),
      },
    });
  } catch (err) {
    // Fail silently
    console.warn(`⚠️ Notification failed: ${err.message}`);
  }

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Booking confirmed and expense recorded successfully',
  });
});

/**
 * @desc    Get all bookings for the logged-in user
 * @route   GET /api/bookings
 * @access  Protected
 */
const getAllBookings = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Booking.countDocuments({ userId: req.user._id });
  const bookings = await Booking.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('tripId', 'title destination startDate endDate');

  res.status(200).json({
    success: true,
    data: {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    },
    message: 'Bookings retrieved successfully',
  });
});

/**
 * @desc    Get all bookings for a specific trip
 * @route   GET /api/bookings/trip/:id
 * @access  Protected
 */
const getBookingsByTrip = asyncHandler(async (req, res, next) => {
  const tripId = req.params.id;

  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const hasAccess = await canAccessTrip(req.user._id, tripId);
  if (!hasAccess) {
    throw new ApiError(403, 'You do not have permission to view bookings for this trip');
  }

  const bookings = await Booking.find({ tripId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: bookings,
    message: 'Trip bookings retrieved successfully',
  });
});

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Protected
 */
const getBookingById = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).populate('tripId', 'title destination');
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const isOwner = booking.userId.toString() === req.user._id.toString();
  const hasAccess = await canAccessTrip(req.user._id, booking.tripId);
  if (!isOwner && !hasAccess) {
    throw new ApiError(403, 'You do not have permission to view this booking');
  }

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking retrieved successfully',
  });
});

/**
 * @desc    Cancel a booking
 * @route   PATCH /api/bookings/:id/cancel (or PUT /api/bookings/:id/cancel)
 * @access  Protected
 */
const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const isOwner = booking.userId.toString() === req.user._id.toString();
  const hasEdit = await canEditTrip(req.user._id, booking.tripId);
  if (!isOwner && !hasEdit) {
    throw new ApiError(403, 'You do not have permission to cancel this booking');
  }

  if (booking.status === 'cancelled') {
    throw new ApiError(400, 'Booking is already cancelled');
  }

  booking.status = 'cancelled';
  await booking.save();

  // Send cancellation notification
  try {
    await notifyUser(req.user._id, {
      title: 'Booking Cancelled',
      body: `Your ${booking.type} booking (${booking.bookingRef}) has been cancelled.`,
      type: 'booking_cancelled',
      data: {
        bookingId: booking._id.toString(),
        bookingRef: booking.bookingRef,
      },
    });
  } catch (err) {
    console.warn(`⚠️ Notification failed: ${err.message}`);
  }

  res.status(200).json({
    success: true,
    data: booking,
    message: 'Booking cancelled successfully',
  });
});

/**
 * @desc    Delete a booking
 * @route   DELETE /api/bookings/:id
 * @access  Protected
 */
const deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const isOwner = booking.userId.toString() === req.user._id.toString();
  const hasEdit = await canEditTrip(req.user._id, booking.tripId);
  if (!isOwner && !hasEdit) {
    throw new ApiError(403, 'You do not have permission to delete this booking');
  }

  await booking.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Booking deleted successfully',
  });
});

module.exports = {
  searchFlights,
  searchHotels,
  createBooking,
  getAllBookings,
  getBookingsByTrip,
  getBookingById,
  cancelBooking,
  deleteBooking,
};
