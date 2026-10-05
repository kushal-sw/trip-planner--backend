const express = require('express');
const { body } = require('express-validator');
const {
  sendNotification,
  getMyNotifications,
} = require('../controllers/notification.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All notification routes are protected
router.use(protect);

const sendValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Body is required'),
  body('type')
    .optional()
    .isIn(['booking_confirmed', 'trip_shared', 'reminder', 'general'])
    .withMessage('Invalid notification type'),
];

// Routes
router.post('/send', validate(sendValidation), sendNotification);
router.get('/', getMyNotifications);

module.exports = router;
