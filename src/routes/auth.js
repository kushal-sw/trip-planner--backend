const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  firebaseLogin,
  updateFcmToken,
} = require('../controllers/auth.controller');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Register validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// FCM token validation rules
const fcmValidation = [
  body('fcmToken').notEmpty().withMessage('fcmToken is required'),
];

// Routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/firebase-login', firebaseLogin);
router.put('/fcm-token', protect, validate(fcmValidation), updateFcmToken);

module.exports = router;

