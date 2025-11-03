// Firebase Cloud Messaging Service Worker
// This file must be in the /public directory and served from the root path

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// WARNING: Firebase configuration is hardcoded here because service workers
// cannot access process.env. This config must be kept in sync with the
// environment variables in .env files and lib/firebase/config.ts.
// If Firebase config changes, update both locations.
// TODO: Consider generating this file at build time to eliminate duplication.
firebase.initializeApp({
  apiKey: "AIzaSyBqYFq9_x8xI0YFmB7J6N8qH5K8b1Z7wQw",
  authDomain: "table-tennis-tracker-edd77.firebaseapp.com",
  projectId: "table-tennis-tracker-edd77",
  storageBucket: "table-tennis-tracker-edd77.firebasestorage.app",
  messagingSenderId: "815077490587",
  appId: "1:815077490587:web:ce3f8e76e0bca8f7f5f3b0",
  measurementId: "G-FDL3FMQRTM"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Time for Table Tennis! 🏓';
  const notificationOptions = {
    body: payload.notification?.body || 'Ready for your daily match?',
    icon: '/icon-192x192.png',
    badge: '/favicon-32x32.png',
    tag: 'daily-match-reminder',
    renotify: false,
    requireInteraction: false,
    data: {
      url: payload.fcmOptions?.link || '/',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
