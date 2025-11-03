import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './config';

let messaging: ReturnType<typeof getMessaging> | null = null;

// Initialize messaging only in browser and if supported
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('[Messaging] Failed to initialize:', error);
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<{
  token: string | null;
  error?: string;
}> {
  if (!messaging) {
    console.warn('[Messaging] Firebase Messaging not initialized');
    return { token: null, error: 'Firebase Messaging not initialized. Service worker may not be supported.' };
  }

  try {
    // Request browser notification permission
    const permission = await Notification.requestPermission();
    console.log('[Messaging] Permission result:', permission);

    if (permission !== 'granted') {
      console.log('[Messaging] Notification permission denied');
      return {
        token: null,
        error: permission === 'denied'
          ? 'Notification permission was denied. Please enable notifications in your browser/system settings.'
          : 'Notification permission request was dismissed.'
      };
    }

    // Validate VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey.trim() === '') {
      console.error('[Messaging] VAPID key is missing or empty.');
      return { token: null, error: 'Configuration error: VAPID key is missing.' };
    }

    // Wait for service worker to be ready
    console.log('[Messaging] Waiting for service worker...');
    const registration = await navigator.serviceWorker.ready;
    console.log('[Messaging] Service worker ready:', registration.scope);

    // Get FCM token
    console.log('[Messaging] Requesting FCM token...');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error('[Messaging] No token received from FCM');
      return { token: null, error: 'Failed to get notification token from Firebase.' };
    }

    console.log('[Messaging] FCM token obtained:', token.substring(0, 20) + '...');
    return { token };
  } catch (error) {
    console.error('[Messaging] Error getting permission/token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      token: null,
      error: `Failed to setup notifications: ${errorMessage}`
    };
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    console.warn('[Messaging] Firebase Messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('[Messaging] Foreground message received:', payload);
    callback(payload);
  });
}

export { messaging };
