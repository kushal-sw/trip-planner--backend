const User = require('../models/User');
const Notification = require('../models/Notification');
const { messaging } = require('../config/firebase');

/**
 * Fail-silent notification helper.
 * 1. Always saves a Notification record in the database.
 * 2. Attempts to send an FCM push notification if user has an fcmToken and Firebase messaging is initialized.
 * 3. Never throws - catches and logs errors so the calling request succeeds regardless of FCM status.
 */
const notifyUser = async (userId, { title, body, type = 'general', data = {} }) => {
  try {
    // 1. Save Notification record in DB
    const notificationRecord = await Notification.create({
      userId,
      title,
      body,
      type,
      data,
    });

    // 2. Fetch user to check for FCM device token
    const user = await User.findById(userId).select('fcmToken');
    if (!user || !user.fcmToken) {
      return notificationRecord;
    }

    // 3. Send FCM push notification if Firebase Messaging is available
    if (messaging) {
      try {
        const payloadData = {};
        for (const [k, v] of Object.entries(data)) {
          payloadData[k] = String(v);
        }

        const fcmResponse = await messaging.send({
          token: user.fcmToken,
          notification: {
            title,
            body,
          },
          data: payloadData,
        });
        console.log(`✅ FCM push notification sent successfully: ${fcmResponse}`);
      } catch (fcmError) {
        console.warn(`⚠️  FCM notification delivery failed for user ${userId}: ${fcmError.message}`);
      }
    }

    return notificationRecord;
  } catch (err) {
    console.warn(`⚠️  Failed to process notification for user ${userId}: ${err.message}`);
    return null;
  }
};

module.exports = notifyUser;
