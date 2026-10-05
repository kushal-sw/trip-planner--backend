const express = require('express');
const { body, param } = require('express-validator');
const {
  createActivity,
  getAllActivities,
  getActivitiesByItinerary,
  getActivityById,
  updateActivity,
  deleteActivity,
} = require('../controllers/activity.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All activity routes are protected
router.use(protect);

// Validations
const createActivityValidation = [
  body('itineraryId').isMongoId().withMessage('Valid itineraryId is required'),
  body('name').trim().notEmpty().withMessage('Activity name is required'),
  body('type')
    .optional()
    .isIn(['sightseeing', 'food', 'adventure', 'shopping', 'transport', 'other'])
    .withMessage('Invalid activity type'),
];

const updateActivityValidation = [
  param('id').isMongoId().withMessage('Invalid activity ID'),
  body('name').optional().trim().notEmpty().withMessage('Activity name cannot be empty'),
  body('type')
    .optional()
    .isIn(['sightseeing', 'food', 'adventure', 'shopping', 'transport', 'other'])
    .withMessage('Invalid activity type'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid activity ID'),
];

const itineraryIdValidation = [
  param('id').isMongoId().withMessage('Invalid itinerary ID'),
];

// Routes
router.post('/', validate(createActivityValidation), createActivity);
router.get('/', getAllActivities);
router.get('/itinerary/:id', validate(itineraryIdValidation), getActivitiesByItinerary);
router.get('/:id', validate(idValidation), getActivityById);
router.put('/:id', validate(updateActivityValidation), updateActivity);
router.delete('/:id', validate(idValidation), deleteActivity);

module.exports = router;
