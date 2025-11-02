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
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('[Messaging] Firebase Messaging not initialized');
    return null;
  }

  try {
    // Request browser notification permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('[Messaging] Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    console.log('[Messaging] FCM token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('[Messaging] Error getting permission/token:', error);
    return null;
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
