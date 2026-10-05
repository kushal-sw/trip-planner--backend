const express = require('express');
const { param } = require('express-validator');
const {
  getAllTips,
  getTipsByDestination,
} = require('../controllers/tips.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All tips routes are protected
router.use(protect);

const destinationIdValidation = [
  param('id').isMongoId().withMessage('Invalid destination ID'),
];

// Routes
router.get('/', getAllTips);
router.get('/destination/:id', validate(destinationIdValidation), getTipsByDestination);

module.exports = router;
