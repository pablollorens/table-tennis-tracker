# Daily Match Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add daily push notifications at 12:40 Amsterdam time to remind users to play table tennis

**Architecture:** GitHub Actions cron triggers Firebase Cloud Function, which queries opted-in users from Firestore and sends batch notifications via Firebase Cloud Messaging (FCM) to PWA installations through service workers.

**Tech Stack:** Firebase Cloud Messaging, Firebase Cloud Functions, GitHub Actions, Next.js PWA, Service Worker API, Web Push API

---

## Task 1: Update TypeScript Types for Notifications

**Files:**
- Modify: `types/index.ts` (add notification fields to Player interface)

**Step 1: Add notification fields to Player interface**

Add these fields to the `Player` interface around line 16-28:

```typescript
export interface Player {
  id: string;
  nickname: string;
  passwordHash: string;
  name: string | null;
  email: string | null;
  avatar: string;
  eloRating: number;
  stats: PlayerStats;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Notification fields
  notificationEnabled?: boolean;  // undefined = not set, false = disabled, true = enabled
  fcmToken?: string;              // Firebase Cloud Messaging token
  fcmTokenUpdatedAt?: Timestamp;  // Track token freshness
}
```

**Step 2: Commit type changes**

```bash
git add types/index.ts
git commit -m "feat: add notification fields to Player type"
```

---

## Task 2: Create Firebase Messaging Configuration

**Files:**
- Create: `lib/firebase/messaging.ts`

**Step 1: Create messaging configuration file**

```typescript
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
```

**Step 2: Commit messaging configuration**

```bash
git add lib/firebase/messaging.ts
git commit -m "feat: add Firebase Cloud Messaging configuration"
```

---

## Task 3: Add Notification Functions to Players Library

**Files:**
- Modify: `lib/firebase/players.ts` (add notification enable/disable functions)

**Step 1: Read current players.ts file**

Read the file to understand the existing structure.

**Step 2: Add notification management functions**

Add these functions at the end of the file (before any export statements):

```typescript
/**
 * Enable notifications for a player and save FCM token
 */
export async function enablePlayerNotifications(
  playerId: string,
  fcmToken: string
): Promise<void> {
  try {
    const playerRef = doc(db, 'players', playerId);
    await updateDoc(playerRef, {
      notificationEnabled: true,
      fcmToken: fcmToken,
      fcmTokenUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`[Players] Notifications enabled for player ${playerId}`);
  } catch (error) {
    console.error(`[Players] Error enabling notifications:`, error);
    throw error;
  }
}

/**
 * Disable notifications for a player
 */
export async function disablePlayerNotifications(playerId: string): Promise<void> {
  try {
    const playerRef = doc(db, 'players', playerId);
    await updateDoc(playerRef, {
      notificationEnabled: false,
      updatedAt: serverTimestamp(),
    });
    console.log(`[Players] Notifications disabled for player ${playerId}`);
  } catch (error) {
    console.error(`[Players] Error disabling notifications:`, error);
    throw error;
  }
}

/**
 * Clear FCM token for a player (when token becomes invalid)
 */
export async function clearPlayerFcmToken(playerId: string): Promise<void> {
  try {
    const playerRef = doc(db, 'players', playerId);
    await updateDoc(playerRef, {
      fcmToken: null,
      fcmTokenUpdatedAt: null,
      updatedAt: serverTimestamp(),
    });
    console.log(`[Players] FCM token cleared for player ${playerId}`);
  } catch (error) {
    console.error(`[Players] Error clearing FCM token:`, error);
    throw error;
  }
}
```

**Step 3: Commit notification functions**

```bash
git add lib/firebase/players.ts
git commit -m "feat: add notification enable/disable functions to players"
```

---

## Task 4: Create Notification Toggle Component

**Files:**
- Create: `components/profile/notification-toggle.tsx`

**Step 1: Create notification toggle component**

```typescript
'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, BellOff } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/firebase/messaging';
import { enablePlayerNotifications, disablePlayerNotifications } from '@/lib/firebase/players';
import toast from 'react-hot-toast';

interface NotificationToggleProps {
  playerId: string;
  initialEnabled: boolean;
}

export function NotificationToggle({ playerId, initialEnabled }: NotificationToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);

    try {
      if (checked) {
        // Request permission and get FCM token
        const token = await requestNotificationPermission();

        if (!token) {
          toast.error('Please enable notifications in your browser settings', {
            duration: 5000,
            position: 'top-center',
          });
          setLoading(false);
          return;
        }

        // Save to Firestore
        await enablePlayerNotifications(playerId, token);
        setEnabled(true);

        toast.success("You'll receive daily reminders at 12:40", {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        // Disable notifications
        await disablePlayerNotifications(playerId);
        setEnabled(false);

        toast.success('Daily reminders disabled', {
          duration: 2000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('[NotificationToggle] Error:', error);
      toast.error('Failed to update notification settings', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="notifications"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
        <Label
          htmlFor="notifications"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
        >
          {enabled ? (
            <Bell className="w-4 h-4 text-blue-600" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400" />
          )}
          Daily Match Reminders
        </Label>
      </div>
      <p className="text-xs text-gray-500 ml-6">
        Get notified at 12:40 to play your daily match
      </p>
    </div>
  );
}
```

**Step 2: Commit notification toggle component**

```bash
git add components/profile/notification-toggle.tsx
git commit -m "feat: create notification toggle component"
```

---

## Task 5: Add Notification Toggle to Profile Form

**Files:**
- Modify: `components/profile/profile-form.tsx` (add notification section)

**Step 1: Import NotificationToggle component**

Add to imports at top of file (around line 1-10):

```typescript
import { NotificationToggle } from '@/components/profile/notification-toggle';
```

**Step 2: Add Notifications section to form**

Add this section after the Email field (around line 129) and before the Submit Button:

```typescript
      {/* Notifications Section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>
        <NotificationToggle
          playerId={player.id}
          initialEnabled={player.notificationEnabled ?? false}
        />
      </div>
```

**Step 3: Test the UI locally**

Run: `npm run dev`
Expected: Profile page loads, notification toggle appears between Email and Save button

**Step 4: Commit profile form changes**

```bash
git add components/profile/profile-form.tsx
git commit -m "feat: add notification toggle to profile form"
```

---

## Task 6: Create Service Worker for Push Notifications

**Files:**
- Create: `public/firebase-messaging-sw.js`

**Step 1: Create service worker file**

```javascript
// Firebase Cloud Messaging Service Worker
// This file must be in the /public directory and served from the root path

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
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
```

**Step 2: Commit service worker**

```bash
git add public/firebase-messaging-sw.js
git commit -m "feat: add Firebase messaging service worker"
```

---

## Task 7: Register Service Worker in App

**Files:**
- Modify: `app/layout.tsx` (register service worker)

**Step 1: Read current layout.tsx**

Read the file to understand current structure.

**Step 2: Add service worker registration**

Add this script to the `<body>` section, right before the closing `</body>` tag:

```typescript
      {/* Service Worker Registration */}
      <Script id="register-sw" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
              .then((registration) => {
                console.log('Service Worker registered:', registration);
              })
              .catch((error) => {
                console.error('Service Worker registration failed:', error);
              });
          }
        `}
      </Script>
```

**Step 3: Import Script component if not already imported**

Add to imports at top:

```typescript
import Script from 'next/script';
```

**Step 4: Commit service worker registration**

```bash
git add app/layout.tsx
git commit -m "feat: register Firebase messaging service worker"
```

---

## Task 8: Create Cloud Function for Sending Notifications

**Files:**
- Modify: `functions/src/index.ts` (add sendDailyNotification function)

**Step 1: Add sendDailyNotification function**

Add this function after the `cleanupInactiveUsers` function:

```typescript
/**
 * HTTP-triggered Cloud Function to send daily match notifications.
 *
 * Triggered by GitHub Actions daily at 12:40 Amsterdam time.
 *
 * Authentication: Checks for NOTIFICATION_SECRET in request header.
 *
 * Sends FCM push notifications to all users with notificationEnabled=true.
 */
export const sendDailyNotification = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: ["NOTIFICATION_SECRET"],
    invoker: "public",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    // Authentication
    const secret = req.headers.authorization?.replace("Bearer ", "") ||
                   req.query.secret as string;
    const expectedSecret = process.env.NOTIFICATION_SECRET;

    logger.info(`Notification request received. Has secret: ${!!secret}`);

    if (!expectedSecret || secret !== expectedSecret) {
      logger.warn("Unauthorized notification request");
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    try {
      logger.info("Starting daily notification send...");

      // Query users with notifications enabled and valid FCM token
      const usersSnapshot = await db
        .collection("players")
        .where("notificationEnabled", "==", true)
        .get();

      if (usersSnapshot.empty) {
        logger.info("No users opted in for notifications");
        res.status(200).json({
          success: true,
          sent: 0,
          failed: 0,
          cleaned: 0,
          message: "No users opted in",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract FCM tokens
      const tokensWithUsers: Array<{token: string; userId: string}> = [];
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken) {
          tokensWithUsers.push({
            token: data.fcmToken,
            userId: doc.id,
          });
        }
      });

      if (tokensWithUsers.length === 0) {
        logger.info("No valid FCM tokens found");
        res.status(200).json({
          success: true,
          sent: 0,
          failed: 0,
          cleaned: 0,
          message: "No valid FCM tokens",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.info(`Sending notifications to ${tokensWithUsers.length} users`);

      // Build FCM message
      const tokens = tokensWithUsers.map((t) => t.token);
      const message = {
        notification: {
          title: "Time for Table Tennis! 🏓",
          body: "Ready for your daily match?",
        },
        webpush: {
          fcmOptions: {
            link: "/",
          },
          notification: {
            icon: "/icon-192x192.png",
            badge: "/favicon-32x32.png",
          },
        },
        tokens: tokens,
      };

      // Send multicast message
      const response = await admin.messaging().sendEachForMulticast(message);

      logger.info(`Sent: ${response.successCount}, Failed: ${response.failureCount}`);

      // Clean up invalid tokens
      let cleanedCount = 0;
      if (response.failureCount > 0) {
        const invalidTokenPromises: Promise<void>[] = [];

        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              const userId = tokensWithUsers[idx].userId;
              logger.info(`Cleaning invalid token for user: ${userId}`);

              invalidTokenPromises.push(
                db.collection("players").doc(userId).update({
                  fcmToken: null,
                  fcmTokenUpdatedAt: null,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                })
              );
              cleanedCount++;
            }
          }
        });

        await Promise.all(invalidTokenPromises);
      }

      res.status(200).json({
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
        cleaned: cleanedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error sending notifications:", error);
      res.status(500).json({
        success: false,
        error: "Notification send failed",
        timestamp: new Date().toISOString(),
      });
    }
  }
);
```

**Step 2: Test function compiles**

Run: `npm run build` (or `cd functions && npm run build`)
Expected: No TypeScript errors

**Step 3: Commit cloud function**

```bash
git add functions/src/index.ts
git commit -m "feat: add sendDailyNotification cloud function"
```

---

## Task 9: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-notification.yml`

**Step 1: Create workflow file**

```yaml
name: Daily Match Notification

on:
  # Run daily at 11:40 UTC (12:40 CET in winter, 13:40 CEST in summer)
  schedule:
    - cron: '40 11 * * *'

  # Allow manual trigger for testing
  workflow_dispatch:

jobs:
  send-notification:
    runs-on: ubuntu-latest

    steps:
      - name: Send daily notification
        run: |
          max_attempts=3
          attempt=1

          while [ $attempt -le $max_attempts ]; do
            echo "Attempt $attempt of $max_attempts..."

            response=$(curl -s -w "\n%{http_code}" \
              --max-time 60 \
              --connect-timeout 10 \
              --retry 2 \
              --retry-delay 5 \
              -H "Authorization: Bearer ${{ secrets.NOTIFICATION_SECRET }}" \
              https://us-central1-table-tennis-tracker-edd77.cloudfunctions.net/sendDailyNotification)

            http_code=$(echo "$response" | tail -n1)
            body=$(echo "$response" | head -n-1)

            echo "HTTP Status: $http_code"
            echo "Response: $body"

            if [ "$http_code" = "200" ]; then
              echo "✅ Notification sent successfully"
              exit 0
            elif [ "$http_code" = "504" ] && [ $attempt -lt $max_attempts ]; then
              echo "⏳ Timeout occurred, retrying in 10 seconds..."
              sleep 10
              attempt=$((attempt + 1))
            else
              echo "❌ Notification failed with status $http_code"
              exit 1
            fi
          done

          echo "❌ All retry attempts exhausted"
          exit 1
```

**Step 2: Commit workflow**

```bash
git add .github/workflows/daily-notification.yml
git commit -m "feat: add GitHub Actions workflow for daily notifications"
```

---

## Task 10: Add Environment Variables Documentation

**Files:**
- Create: `.env.local.example` (if doesn't exist) or modify existing

**Step 1: Add VAPID key documentation**

Add this to `.env.local.example`:

```
# Firebase Cloud Messaging VAPID Key
# Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**Step 2: Commit environment example**

```bash
git add .env.local.example
git commit -m "docs: add VAPID key to environment variables"
```

---

## Task 11: Deploy and Test

**Files:**
- N/A (deployment and testing tasks)

**Step 1: Generate Firebase VAPID key**

Run in Firebase Console or using Firebase CLI:
```bash
# Visit Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
# Click "Generate key pair"
# Copy the key
```

Expected: VAPID key copied to clipboard

**Step 2: Add VAPID key to .env.local**

Add to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=<your-key-here>
```

**Step 3: Deploy Cloud Function**

Run: `firebase deploy --only functions:sendDailyNotification`
Expected: Function deployed successfully

**Step 4: Add NOTIFICATION_SECRET to Firebase**

Run:
```bash
firebase functions:secrets:set NOTIFICATION_SECRET
```
Enter a strong random secret when prompted

**Step 5: Add NOTIFICATION_SECRET to GitHub Secrets**

1. Go to GitHub repo > Settings > Secrets > Actions
2. Click "New repository secret"
3. Name: `NOTIFICATION_SECRET`
4. Value: Same value as Firebase secret
5. Click "Add secret"

**Step 6: Test notification flow locally**

1. Run: `npm run dev`
2. Navigate to Profile page
3. Enable notification toggle
4. Grant permission in browser
5. Check browser console for FCM token
6. Check Firestore for updated player document

Expected:
- Browser shows permission prompt
- Console shows FCM token
- Firestore has `notificationEnabled: true` and `fcmToken: "..."`

**Step 7: Test Cloud Function manually**

Using Firebase Console or curl:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_NOTIFICATION_SECRET" \
  https://us-central1-table-tennis-tracker-edd77.cloudfunctions.net/sendDailyNotification
```

Expected:
- Function returns 200
- Response shows sent count
- Notification appears on device

**Step 8: Test GitHub Action manually**

1. Go to GitHub repo > Actions
2. Select "Daily Match Notification" workflow
3. Click "Run workflow" > "Run workflow"
4. Wait for completion

Expected:
- Workflow runs successfully
- Cloud Function called
- Notification delivered

**Step 9: Verify notification appears**

Expected:
- Notification shows: "Time for Table Tennis! 🏓"
- Body: "Ready for your daily match?"
- Click opens PWA to dashboard

**Step 10: Final commit and push**

```bash
git add .
git commit -m "feat: complete daily match notifications implementation"
git push origin main
```

---

## Success Criteria

- [ ] Users can opt-in to notifications via Profile page
- [ ] Browser permission requested when toggle enabled
- [ ] FCM token saved to Firestore
- [ ] Service worker registered and handles push events
- [ ] Cloud Function sends notifications to opted-in users
- [ ] Invalid tokens automatically cleaned up
- [ ] GitHub Action runs daily at 11:40 UTC
- [ ] Notifications appear on mobile and desktop
- [ ] Clicking notification opens/focuses PWA

## Testing Checklist

- [ ] Profile page loads without errors
- [ ] Notification toggle works (enable/disable)
- [ ] Browser permission prompt appears
- [ ] FCM token saved to Firestore
- [ ] Service worker registered successfully
- [ ] Cloud Function deploys without errors
- [ ] Cloud Function authentication works
- [ ] Notifications sent successfully
- [ ] Invalid tokens cleaned up
- [ ] GitHub Action workflow runs successfully
- [ ] Manual workflow trigger works

## Rollback Plan

If issues occur:
1. Disable GitHub Actions workflow (comment out schedule)
2. Users can disable via Profile toggle
3. Redeploy previous Cloud Function version
4. No breaking changes to existing features

## Notes

- Service worker must be served from root path (`/firebase-messaging-sw.js`)
- VAPID key required for Web Push API
- Notifications require HTTPS (works on localhost for testing)
- GitHub Actions cron may have ±15 minute variance
- FCM tokens can expire - automatic cleanup handles this
- Timezone shift accepted: 12:40 winter, 13:40 summer
