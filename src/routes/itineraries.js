const express = require('express');
const { body, param } = require('express-validator');
const {
  createItinerary,
  getAllItineraries,
  getItinerariesByTrip,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
} = require('../controllers/itinerary.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All itinerary routes are protected
router.use(protect);

// Validations
const createItineraryValidation = [
  body('tripId').isMongoId().withMessage('Valid tripId is required'),
  body('dayNumber').isInt({ min: 1 }).withMessage('dayNumber must be a positive integer'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
];

const updateItineraryValidation = [
  param('id').isMongoId().withMessage('Invalid itinerary ID'),
  body('dayNumber').optional().isInt({ min: 1 }).withMessage('dayNumber must be a positive integer'),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid itinerary ID'),
];

const tripIdValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
];

// Routes
router.post('/', validate(createItineraryValidation), createItinerary);
router.get('/', getAllItineraries);
router.get('/trip/:id', validate(tripIdValidation), getItinerariesByTrip);
router.get('/:id', validate(idValidation), getItineraryById);
router.put('/:id', validate(updateItineraryValidation), updateItinerary);
router.delete('/:id', validate(idValidation), deleteItinerary);

module.exports = router;
