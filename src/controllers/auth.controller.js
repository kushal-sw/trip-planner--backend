const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { admin } = require('../config/firebase');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Create user - explicitly ignoring any role passed in request body
  const user = await User.create({
    name,
    email,
    password,
    avatar: avatar || '',
    role: 'user', // Forced to 'user'
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    },
    message: 'User registered successfully',
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Explicitly select password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        fcmToken: user.fcmToken,
        createdAt: user.createdAt,
      },
    },
    message: 'Login successful',
  });
});

/**
 * @desc    Firebase Auth login/register via Firebase ID token
 * @route   POST /api/auth/firebase-login
 * @access  Public
 */
const firebaseLogin = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  if (!admin) {
    throw new ApiError(
      503,
      'Firebase authentication service is currently unavailable. Please use standard email/password authentication or configure Firebase.'
    );
  }

  if (!idToken) {
    throw new ApiError(400, 'Firebase idToken is required');
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    throw new ApiError(401, `Invalid Firebase token: ${err.message}`);
  }

  const { uid, email, name, picture } = decodedToken;

  if (!email) {
    throw new ApiError(400, 'Firebase user account does not have an associated email');
  }

  let user = await User.findOne({
    $or: [{ firebaseUid: uid }, { email }],
  });

  if (user) {
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }
  } else {
    // Generate secure random password for user
    const randomPassword = crypto.randomBytes(16).toString('hex');
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      password: randomPassword,
      firebaseUid: uid,
      avatar: picture || '',
      role: 'user',
    });
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        fcmToken: user.fcmToken,
        createdAt: user.createdAt,
      },
    },
    message: 'Firebase authentication successful',
  });
});

/**
 * @desc    Update FCM device token
 * @route   PUT /api/auth/fcm-token
 * @access  Protected
 */
const updateFcmToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    throw new ApiError(400, 'fcmToken is required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { fcmToken },
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    data: {
      fcmToken: user.fcmToken,
    },
    message: 'FCM token updated successfully',
  });
});

module.exports = {
  register,
  login,
  firebaseLogin,
  updateFcmToken,
};
