const express = require('express');
const { body, param } = require('express-validator');
const {
  createBooking,
  getAllBookings,
  getBookingsByTrip,
  getBookingById,
  cancelBooking,
  deleteBooking,
} = require('../controllers/booking.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All booking routes are protected
router.use(protect);

// Validations
const createBookingValidation = [
  body('tripId').isMongoId().withMessage('Valid tripId is required'),
  body('type').isIn(['flight', 'hotel']).withMessage("type must be either 'flight' or 'hotel'"),
  body('details').isObject().withMessage('details object is required'),
  body('totalAmount').isNumeric().withMessage('totalAmount must be a numeric value'),
];

const tripIdValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
];

// Routes
router.post('/', validate(createBookingValidation), createBooking);
router.get('/', getAllBookings);
router.get('/trip/:id', validate(tripIdValidation), getBookingsByTrip);
router.get('/:id', validate(idValidation), getBookingById);
router.patch('/:id/cancel', validate(idValidation), cancelBooking);
router.put('/:id/cancel', validate(idValidation), cancelBooking);
router.delete('/:id', validate(idValidation), deleteBooking);

module.exports = router;
