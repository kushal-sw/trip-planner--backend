const express = require('express');
const { body } = require('express-validator');
const {
  getDestinations,
  createDestination,
  getDestinationById,
  updateDestination,
  deleteDestination,
} = require('../controllers/destination.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { param } = require('express-validator');

const router = express.Router();

// Validation for destination creation
const createDestinationValidation = [
  body('name').trim().notEmpty().withMessage('Destination name is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid destination ID'),
];

// Routes
// Note: mounted at /api/admin/destinations and /api/destinations
router.get('/', protect, getDestinations);
router.get('/:id', protect, validate(idValidation), getDestinationById);
router.post(
  '/',
  protect,
  authorize('admin'),
  validate(createDestinationValidation),
  createDestination
);
router.put(
  '/:id',
  protect,
  authorize('admin'),
  validate(idValidation),
  updateDestination
);
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  validate(idValidation),
  deleteDestination
);

module.exports = router;
