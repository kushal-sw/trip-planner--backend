const User = require('../models/User');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const notifyUser = require('../utils/notifyUser');

/**
 * @desc    Send manual notification (Admin or Self only)
 * @route   POST /api/notifications/send
 * @access  Protected
 */
const sendNotification = asyncHandler(async (req, res, next) => {
  const { userId, title, body, type, data } = req.body;

  const targetUserId = userId || req.user._id.toString();

  // Restriction: Only admin can send to other users; regular users can only send to themselves
  const isAdmin = req.user.role === 'admin';
  const isSelf = targetUserId.toString() === req.user._id.toString();

  if (!isAdmin && !isSelf) {
    throw new ApiError(403, 'You are not authorized to send notifications to other users');
  }

  // Ensure target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, 'Target user not found');
  }

  const notification = await notifyUser(targetUserId, {
    title,
    body,
    type: type || 'general',
    data: data || {},
  });

  res.status(200).json({
    success: true,
    data: notification,
    message: 'Notification processed successfully',
  });
});

/**
 * @desc    Get current user's notifications (bonus utility for in-app viewing)
 * @route   GET /api/notifications
 * @access  Protected
 */
const getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ sentAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    data: notifications,
    message: 'Notifications retrieved successfully',
  });
});

module.exports = {
  sendNotification,
  getMyNotifications,
};
