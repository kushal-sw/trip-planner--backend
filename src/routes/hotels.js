const express = require('express');
const { searchHotels } = require('../controllers/booking.controller');
const protect = require('../middleware/auth');

const router = express.Router();

// Protected hotel search route (returns mock data)
router.get('/', protect, searchHotels);

module.exports = router;
