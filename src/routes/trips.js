const express = require('express');
const { body, param } = require('express-validator');
const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripOfflineBundle,
} = require('../controllers/trip.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All trip routes are protected
router.use(protect);

// Validations
const createTripValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('destination').trim().notEmpty().withMessage('Destination is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
];

const updateTripValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('startDate').optional().isISO8601().withMessage('Valid start date required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date required'),
];

const tripIdValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
];

// Routes
router.post('/', validate(createTripValidation), createTrip);
router.get('/', getAllTrips);
router.get('/:id/offline', validate(tripIdValidation), getTripOfflineBundle);
router.get('/:id', validate(tripIdValidation), getTripById);
router.put('/:id', validate(updateTripValidation), updateTrip);
router.delete('/:id', validate(tripIdValidation), deleteTrip);

module.exports = router;

