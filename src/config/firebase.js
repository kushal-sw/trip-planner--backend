const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

let firebaseApp = null;
let messaging = null;
let auth = null;

try {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountRaw || !serviceAccountRaw.trim()) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT is not set. Firebase features (firebase-login, push notifications) will be disabled.');
  } else {
    let serviceAccount;
    const trimmed = serviceAccountRaw.trim();

    // 1. Check if it's a file path (relative or absolute)
    const resolvedPath = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } else if (trimmed.startsWith('{')) {
      // 2. Raw JSON string
      serviceAccount = JSON.parse(trimmed);
    } else {
      // 3. Base64 encoded JSON
      try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } catch (err) {
        serviceAccount = JSON.parse(trimmed);
      }
    }

    // Ensure private_key newline formatting is intact
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    // Support both v14 admin.cert and legacy admin.credential.cert
    const credentialCert = admin.cert
      ? admin.cert(serviceAccount)
      : admin.credential && admin.credential.cert(serviceAccount);

    firebaseApp = admin.initializeApp({
      credential: credentialCert,
    });

    messaging = getMessaging(firebaseApp);
    auth = getAuth(firebaseApp);

    // Provide backward compatibility for admin.auth() and admin.messaging()
    admin.auth = () => auth;
    admin.messaging = () => messaging;

    console.log('✅ Firebase Admin SDK initialized successfully');
  }
} catch (err) {
  console.error(`❌ Firebase init failed: ${err.message}. Firebase features will be disabled.`);
  firebaseApp = null;
  messaging = null;
  auth = null;
}

module.exports = { admin: firebaseApp ? admin : null, messaging, auth };


