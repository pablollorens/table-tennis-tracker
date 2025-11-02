# Daily Match Notifications Design

**Date:** 2025-11-03
**Status:** Design Complete, Ready for Implementation

## Overview

Add daily push notifications at 12:40 Amsterdam time to remind users to play their table tennis match. Users opt-in via Profile page, notifications delivered via Firebase Cloud Messaging (FCM) to PWA installations.

## Requirements

- Daily notification at 12:40 Amsterdam time (11:40 UTC, shifts seasonally with DST)
- GitHub Actions triggers the schedule
- Web Push API with FCM for PWA notifications
- Users opt-in through Profile page
- Store preferences in Firestore users collection

## Architecture

### High-Level Flow

```
GitHub Actions (cron: 40 11 * * *)
    ↓
    HTTP POST (with auth token)
    ↓
Firebase Cloud Function (sendDailyNotification)
    ↓
    Query Firestore (users with notificationEnabled=true)
    ↓
Firebase Cloud Messaging (FCM)
    ↓
    Push to all registered devices
    ↓
Service Worker (firebase-messaging-sw.js)
    ↓
Display Notification → Click → Open PWA Dashboard
```

### Components

1. **GitHub Actions Workflow** (`.github/workflows/daily-notification.yml`)
   - Cron schedule: `40 11 * * *` (11:40 UTC daily)
   - Sends authenticated HTTP request to Cloud Function
   - Retries up to 3 times on failure

2. **Cloud Function** (`functions/src/sendDailyNotification.ts`)
   - HTTP callable endpoint
   - Requires authentication token
   - Queries opted-in users
   - Sends batch notification via FCM
   - Cleans up invalid tokens

3. **PWA Service Worker** (`public/firebase-messaging-sw.js`)
   - Handles FCM push events
   - Displays notification
   - Handles click to open/focus app

4. **Profile Page Updates**
   - Add "Notifications" section
   - Toggle for "Daily Match Reminders"
   - Request browser permission
   - Save FCM token to Firestore

5. **Firestore Schema**
   - Add fields to `users/{userId}`:
     - `notificationEnabled?: boolean`
     - `fcmToken?: string`
     - `fcmTokenUpdatedAt?: Timestamp`

## User Experience

### Profile Page Structure

```
Profile
├── Nickname field
├── Full Name field
├── Password field
├── Notifications section (NEW)
│   └── Daily Match Reminders toggle
├── Save button
└── Logout button
```

### Opt-in Flow

1. User visits Profile page
2. Sees "Daily Match Reminders" toggle in Notifications section
3. Enables toggle
4. Browser prompts for notification permission
5. If granted:
   - App requests FCM token
   - Saves to Firestore: `notificationEnabled: true`, `fcmToken: "..."`
   - Shows success: "You'll receive daily reminders at 12:40"
6. If denied:
   - Shows message: "Enable notifications in your browser settings to receive reminders"
   - Toggle remains off

### Notification Experience

- **Time:** 12:40 CET (winter) / 13:40 CEST (summer)
- **Title:** "Time for Table Tennis! 🏓"
- **Body:** "Ready for your daily match?"
- **Icon:** `/icon-192x192.png`
- **Click action:** Opens/focuses PWA on dashboard

## Implementation Details

### Cloud Function: sendDailyNotification

**Authentication:**
- Requires `Authorization: Bearer ${SECRET_TOKEN}` header
- Token stored in GitHub Secrets and Firebase config
- Returns 401 if invalid

**Logic:**
1. Verify authentication token
2. Query Firestore:
   ```typescript
   db.collection('users')
     .where('notificationEnabled', '==', true)
     .where('fcmToken', '!=', null)
     .get()
   ```
3. Extract FCM tokens from results
4. Build multicast message:
   ```typescript
   {
     notification: {
       title: "Time for Table Tennis! 🏓",
       body: "Ready for your daily match?",
       icon: "/icon-192x192.png"
     },
     webpush: {
       fcmOptions: { link: "/" }
     },
     tokens: [...fcmTokens]
   }
   ```
5. Send via `admin.messaging().sendEachForMulticast()`
6. Process responses:
   - Log success count
   - For invalid tokens → Set `fcmToken: null` in Firestore
7. Return summary: `{ sent: X, failed: Y, cleaned: Z }`

**Error Handling:**
- Function timeout: 60s
- Handles FCM errors per-token
- Automatic cleanup of invalid tokens

### GitHub Actions Workflow

**File:** `.github/workflows/daily-notification.yml`

```yaml
name: Daily Match Notification
on:
  schedule:
    - cron: '40 11 * * *'  # 11:40 UTC = 12:40 CET (winter) / 13:40 CEST (summer)
  workflow_dispatch:  # Manual trigger for testing

jobs:
  send-notification:
    runs-on: ubuntu-latest
    steps:
      - name: Send notification
        run: |
          response=$(curl -X POST \
            -H "Authorization: Bearer ${{ secrets.NOTIFICATION_SECRET }}" \
            -w "\n%{http_code}" \
            https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/sendDailyNotification)

          http_code=$(echo "$response" | tail -n1)
          if [ "$http_code" != "200" ]; then
            echo "Failed with status $http_code"
            exit 1
          fi
```

**Secrets Required:**
- `NOTIFICATION_SECRET` - Shared secret for Cloud Function authentication

**Timezone Handling:**
- Always runs at 11:40 UTC
- Results in 12:40 CET (winter) and 13:40 CEST (summer)
- Seasonal 1-hour shift accepted for simplicity

### Service Worker

**File:** `public/firebase-messaging-sw.js`

```typescript
importScripts('https://www.gstatic.com/firebasejs/X.X.X/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/X.X.X/firebase-messaging-compat.js');

firebase.initializeApp({
  // Firebase config
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    badge: '/badge-icon.png',
    tag: 'daily-match-reminder',
    renotify: false,
    requireInteraction: false,
    data: { url: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
```

## Error Handling & Edge Cases

### Token Management
- **Invalid tokens:** Detected via FCM error responses, automatically removed from Firestore
- **Expired tokens:** Users can re-enable by toggling off/on in Profile
- **Token refresh:** Handled automatically by Firebase SDK

### Permission Denied
- Show user-friendly message with instructions
- Don't save to Firestore
- Allow retry on subsequent toggle

### Network Failures
- **GitHub Action:** 3 retries with exponential backoff
- **Cloud Function:** Will be retried by GitHub Action
- **Service Worker:** Queues notifications when offline, delivers when connected

### No Users Opted In
- Cloud Function returns early with success
- Logs: "No users opted in for notifications"
- No FCM calls made

### Rate Limiting
- FCM: Unlimited messages (free tier)
- Cloud Functions: 2M invocations/month (we use ~30/month)
- Well within limits

## Testing Strategy

### Local Development
1. **Service Worker:**
   - Test FCM token generation in localhost
   - Use Firebase Console "Send test message" with token
   - Verify notification display and click behavior

2. **Cloud Function:**
   - Use Firebase emulators: `firebase emulators:start --only functions`
   - Create test users with valid tokens
   - Trigger with curl + test auth token
   - Verify FCM calls and delivery

3. **Profile UI:**
   - Toggle permissions on/off
   - Verify Firestore updates
   - Test permission denied scenario
   - Test token refresh

### Production Testing
1. Add `workflow_dispatch` to GitHub Action for manual triggering
2. Create test user and enable notifications
3. Manually trigger workflow
4. Verify notification arrives on device
5. Check Cloud Function logs
6. Enable cron schedule

### Monitoring
- **Cloud Function logs:** Daily success/failure counts
- **Firestore:** Track `notificationEnabled: true` user count
- **GitHub Actions:** Workflow run history

### Rollback Plan
- Disable GitHub Actions cron (comment out schedule)
- Users can disable via Profile toggle
- No breaking changes to existing features

## Security Considerations

1. **Authentication token:** Prevents unauthorized triggering of notifications
2. **Token storage:** FCM tokens in Firestore secured by existing security rules
3. **User consent:** Explicit opt-in required, respects browser permission model
4. **Data privacy:** No personal data in notification payload
5. **Token cleanup:** Invalid tokens automatically removed

## Future Enhancements (Out of Scope)

- User-configurable notification time
- Timezone-aware per-user notifications
- Smart notifications (only if no match played today)
- Notification customization (message, emoji)
- Multiple reminder times
- Weekly summary notifications

## Dependencies

- Firebase Cloud Messaging (included in Firebase)
- Firebase Admin SDK (already in use)
- GitHub Actions (already in use)
- Service Worker API (PWA standard)
- Web Push API (browser standard)

## Estimated Complexity

- **Frontend (Profile UI + Service Worker):** 4-6 hours
- **Backend (Cloud Function):** 2-3 hours
- **GitHub Actions:** 1 hour
- **Testing & Debugging:** 3-4 hours
- **Total:** ~10-14 hours

## Success Criteria

- [ ] Users can opt-in to notifications via Profile page
- [ ] Notifications sent daily at 12:40 Amsterdam time
- [ ] Notifications appear on mobile and desktop PWA installations
- [ ] Clicking notification opens/focuses the app
- [ ] Invalid tokens automatically cleaned up
- [ ] No notifications sent to users who haven't opted in
- [ ] GitHub Action runs reliably daily
- [ ] Cloud Function handles errors gracefully
