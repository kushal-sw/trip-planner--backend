const express = require('express');
const authRoutes = require('./auth');
const tripRoutes = require('./trips');
const itineraryRoutes = require('./itineraries');
const activityRoutes = require('./activities');
const bookingRoutes = require('./bookings');
const flightRoutes = require('./flights');
const hotelRoutes = require('./hotels');
const expenseRoutes = require('./expenses');
const destinationRoutes = require('./destinations');
const weatherRoutes = require('./weather');
const tipsRoutes = require('./tips');
const shareRoutes = require('./share');
const notificationRoutes = require('./notifications');
const photoRoutes = require('./photos');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/itineraries', itineraryRoutes);
router.use('/activities', activityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/flights', flightRoutes);
router.use('/hotels', hotelRoutes);
router.use('/expenses', expenseRoutes);

// Phase 4 routes
router.use('/admin/destinations', destinationRoutes);
router.use('/destinations', destinationRoutes);
router.use('/weather', weatherRoutes);
router.use('/tips', tipsRoutes);
router.use('/share', shareRoutes);

// Phase 5 routes
router.use('/notifications', notificationRoutes);

// Phase 6 bonus routes
router.use('/photos', photoRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    message: 'Server is healthy',
  });
});

module.exports = router;
