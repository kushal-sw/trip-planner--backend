importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Immediately activate service worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const defaultConfig = {
  apiKey: "AIzaSyDxoFMUufTGXBxvHmk4dfsbpvmzLzoW7R0",
  authDomain: "trip-planner-1d212.firebaseapp.com",
  projectId: "trip-planner-1d212",
  storageBucket: "trip-planner-1d212.firebasestorage.app",
  messagingSenderId: "31456800299",
  appId: "1:31456800299:web:8511a1710be461046fc46e",
  measurementId: "G-QLR0W2L4XB"
};

try {
  let config = defaultConfig;
  const urlParams = new URL(location).searchParams;
  const configRaw = urlParams.get('config');
  if (configRaw) {
    try {
      config = JSON.parse(decodeURIComponent(configRaw));
    } catch (e) {}
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
    const title = payload.notification?.title || payload.data?.title || 'TripPlanner Push';
    const options = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: '/favicon.ico',
      data: payload.data,
    };
    self.registration.showNotification(title, options);
  });
} catch (err) {
  console.error('[firebase-messaging-sw.js] Service worker initialization error:', err);
}
