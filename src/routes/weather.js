const express = require('express');
const { param } = require('express-validator');
const {
  getWeather,
  getWeatherByDestination,
} = require('../controllers/weather.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All weather routes are protected
router.use(protect);

const destinationIdValidation = [
  param('id').isMongoId().withMessage('Invalid destination ID'),
];

// Routes
router.get('/', getWeather);
router.get('/destination/:id', validate(destinationIdValidation), getWeatherByDestination);

module.exports = router;
