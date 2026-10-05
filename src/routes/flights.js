const express = require('express');
const { searchFlights } = require('../controllers/booking.controller');
const protect = require('../middleware/auth');

const router = express.Router();

// Protected flight search route (returns mock data)
router.get('/', protect, searchFlights);

module.exports = router;
