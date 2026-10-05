const express = require('express');
const { body, param } = require('express-validator');
const { shareTrip, getSharesByTrip, revokeShare } = require('../controllers/share.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All share routes are protected
router.use(protect);

const shareValidation = [
  body('tripId').isMongoId().withMessage('Valid tripId is required'),
  body('emails').notEmpty().withMessage('At least one email is required'),
  body('permission')
    .optional()
    .isIn(['view', 'edit'])
    .withMessage("Permission must be 'view' or 'edit'"),
];

const tripIdValidation = [
  param('id').isMongoId().withMessage('Invalid trip ID'),
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid share ID'),
];

// Routes
router.post('/', validate(shareValidation), shareTrip);
router.get('/trip/:id', validate(tripIdValidation), getSharesByTrip);
router.delete('/:id', validate(idValidation), revokeShare);

module.exports = router;
