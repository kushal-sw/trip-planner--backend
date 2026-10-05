const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { admin } = require('../config/firebase');

/**
 * Hybrid Authentication Middleware
 * 1. Checks Bearer token in Authorization header.
 * 2. Attempts to verify as internal App JWT (HMAC-SHA256).
 * 3. If JWT verification fails, falls back to verifying as Firebase ID Token.
 * 4. Links or auto-provisions the user in MongoDB if authenticated via Firebase.
 * 5. Attaches req.user, req.authType ('jwt' | 'firebase'), and calls next().
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorized — no token provided');
  }

  const token = authHeader.split(' ')[1];

  // Strategy 1: Attempt Internal JWT Verification
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded && decoded.id) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.authType = 'jwt';
        return next();
      }
      throw new ApiError(401, 'Not authorized — user no longer exists');
    }
  } catch (jwtErr) {
    if (jwtErr instanceof ApiError) {
      throw jwtErr;
    }
    // Fall through to Strategy 2 (Firebase verification)
  }

  // Strategy 2: Attempt Firebase ID Token Verification (if Firebase Admin is initialized)
  if (admin && typeof admin.auth === 'function') {
    try {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      if (decodedFirebase && decodedFirebase.uid) {
        const { uid, email, name, picture } = decodedFirebase;

        const queryConditions = [{ firebaseUid: uid }];
        if (email) queryConditions.push({ email });

        let user = await User.findOne({ $or: queryConditions });

        if (user) {
          if (!user.firebaseUid) {
            user.firebaseUid = uid;
            await user.save();
          }
        } else {
          // Auto-provision user account for first-time Firebase login
          const randomPassword = crypto.randomBytes(16).toString('hex');
          user = await User.create({
            name: name || (email ? email.split('@')[0] : 'Firebase User'),
            email: email || `${uid}@firebase.local`,
            password: randomPassword,
            firebaseUid: uid,
            avatar: picture || '',
            role: 'user',
          });
        }

        req.user = user;
        req.authType = 'firebase';
        req.firebaseUser = decodedFirebase;
        return next();
      }
    } catch (firebaseErr) {
      throw new ApiError(401, `Not authorized — invalid Firebase token: ${firebaseErr.message}`);
    }
  }

  // If neither strategy succeeded
  throw new ApiError(401, 'Not authorized — invalid or expired token');
});

module.exports = protect;

