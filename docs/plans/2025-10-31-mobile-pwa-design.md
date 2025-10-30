# Mobile-First PWA Design - Office Ping Pong Tracker

**Date:** October 31, 2025
**Version:** 1.0
**Status:** Approved for Implementation

---

## Executive Summary

This document defines the mobile-first Progressive Web App (PWA) design for the Office Ping Pong Tracker. It extends the [original project specification](../PROYECTO_PING_PONG.md) with mobile-optimized patterns, PWA features, and offline capabilities using a **balanced approach** - good performance, basic offline support, and native-like experience without extreme optimization.

### Key Design Decisions
- ✅ Mobile-first, portrait-oriented interface
- ✅ Progressive Web App with offline support
- ✅ Firebase + Vercel deployment architecture
- ✅ Touch-optimized UI (44px minimum touch targets)
- ✅ Bottom navigation pattern
- ✅ KISS principle for authentication (client-side verification)

---

## Table of Contents
1. [Architecture](#architecture)
2. [Design Screens](#design-screens)
3. [Mobile UI/UX Patterns](#mobile-uiux-patterns)
4. [PWA Configuration](#pwa-configuration)
5. [Offline Strategy](#offline-strategy)
6. [Performance Targets](#performance-targets)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- `next-pwa` for Progressive Web App support
- Workbox for service worker strategies
- Shadcn/ui components (touch-optimized)
- Tailwind CSS (mobile-first breakpoints)
- React Hook Form + Zod
- date-fns for date handling

**Backend:**
- Firebase Firestore (with offline persistence enabled)
- Firebase Auth (password verification)
- bcryptjs (client-side password hashing)

**Deployment:**
- **Vercel** - Frontend hosting (Next.js application)
- **Firebase** - Database only (Firestore + Auth SDK)
- No Firebase Hosting or Cloud Functions needed

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│          User's Mobile Device           │
│  ┌───────────────────────────────────┐ │
│  │   PWA (Installed or Browser)      │ │
│  │   - Next.js App                   │ │
│  │   - Service Worker                │ │
│  │   - IndexedDB Cache               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
            │                    │
            │ HTTPS             │ Firebase SDK
            ▼                    ▼
┌──────────────────┐   ┌──────────────────┐
│  Vercel CDN      │   │  Firebase        │
│  - Static Files  │   │  - Firestore DB  │
│  - API Routes    │   │  - Auth Config   │
│  - Edge Network  │   │  - Offline Cache │
└──────────────────┘   └──────────────────┘
```

### Why Vercel + Firebase?

**Vercel Benefits:**
- Created Next.js, so best-in-class hosting
- Automatic HTTPS and global CDN
- Preview deployments per git branch
- Excellent performance and caching
- Simple environment variable management

**Firebase Benefits:**
- Real-time database with offline support
- Automatic data synchronization
- Client SDK handles all complexity
- No backend code needed
- Free tier suitable for office use

---

## Design Screens

All design specifications are located in [`docs/design_specs/`](../design_specs/) with both PNG images and HTML code.

### Screen Flow

```
Login Screen
    ↓
Dashboard (Home)
    ↓
┌───────────────┬──────────────────┬─────────────┐
│               │                  │             │
Player         Today's          Ranking        (Future)
Selection      Matches          Leaderboard    Profile
    ↓              ↓
Create Session → Match Result Recording
```

### Screen Inventory

1. **Login Screen** ([design](../design_specs/stitch_player_selection_screen/login_screen/))
   - Ping pong icon branding
   - Password input with show/hide toggle
   - Error state displayed
   - Clean, minimal design

2. **Player Selection Screen** ([design](../design_specs/stitch_player_selection_screen/player_selection_screen/))
   - Search bar for filtering players
   - Checkbox selection with avatars
   - Shows ELO rating per player
   - Counter: "4 players selected → Generates 6 matches"
   - "Create Session" primary action button

3. **Dashboard (Home) Screen** ([design](../design_specs/stitch_player_selection_screen/dashboard_(home)_screen/))
   - Date display (e.g., "Tuesday, Oct 26")
   - Today's Session card with:
     - Total matches count
     - Completed matches count
     - Pending matches count
     - Progress bar visualization
     - "View Today's Matches" button
   - Empty state: "Ready to Play?" with "Create Today's Session" button
   - Bottom navigation: Dashboard, Rankings, Profile

4. **Today's Matches Screen** ([design](../design_specs/stitch_player_selection_screen/today's_matches_screen/))
   - Date header with ping pong icon
   - **Pending section:**
     - Match cards showing Player 1 vs Player 2
     - ELO displayed for each player
     - "Record Result" button
   - **Completed section:**
     - Winner highlighted (green border)
     - Scores displayed
     - ELO changes shown (+8 ELO, -8 ELO)
   - Empty state: "No more matches today!"
   - Floating Action Button (+) for quick actions

5. **Match Result Recording Screen** ([design](../design_specs/stitch_player_selection_screen/match_result_recording_screen/))
   - Bottom sheet modal pattern
   - "Log Match Result" title
   - Player 1 card with avatar, name, ELO, score input
   - "vs" separator
   - Player 2 card with avatar, name, ELO, score input
   - "Save Result" primary button
   - Swipe down to dismiss

6. **Ranking Leaderboard Screen** ([design](../design_specs/stitch_player_selection_screen/ranking_leaderboard_screen/))
   - Trophy icon header
   - Search functionality
   - Ranked list items showing:
     - Rank number (1, 2, 3...)
     - Player avatar
     - Player name
     - Win-loss record (15-4, 79%)
     - Current streak indicator (W5, L1, L2)
     - ELO rating (prominent)
   - Top 3 players get colored borders (gold, silver, bronze)
   - Current user highlighted with blue border
   - Medal/badge icons for top positions

---

## Mobile UI/UX Patterns

### Touch Optimization

**Minimum Touch Targets:**
- All interactive elements: **44x44px minimum** (iOS/Android standard)
- Primary buttons: **48px height minimum**
- Spacing between tappable elements: **8px minimum**

**Button Hierarchy:**
- Primary actions: Solid blue background (`bg-blue-600`)
- Secondary actions: Outline style
- Destructive actions: Red color scheme
- Disabled state: Reduced opacity + cursor-not-allowed

### Mobile-Specific Interactions

**Bottom Sheet Modals:**
- Used for: Match result recording, quick actions
- Behavior: Slides up from bottom, swipe down to dismiss
- Benefits: Thumb-friendly, feels native
- Implementation: Dialog component with position fixed bottom

**Pull-to-Refresh:**
- Enabled on: Today's Matches, Leaderboard
- Visual: Spinner appears on pull
- Triggers: Refetch data from Firestore
- Haptic feedback on refresh trigger

**Swipe Gestures (Optional Enhancement):**
- Swipe right on match card → Quick record result
- Swipe left on match card → Skip match
- Implementation: Use `react-swipeable` or `framer-motion`

**Haptic Feedback:**
- Button press: Light vibration (10ms)
- Match recorded: Success vibration (20ms, 2 pulses)
- Error state: Error vibration (30ms, 3 short pulses)
- Implementation: `navigator.vibrate()` API

### Navigation Pattern

**Bottom Tab Navigation:**
- Position: Fixed at bottom of viewport
- Tabs: Dashboard, Rankings, Profile
- Active state: Blue color + icon fill
- Icons: Lucide React icons
- Safe area: Account for iPhone notch/home indicator

**Page Headers:**
- Sticky position at top
- Back button when needed (< 48px touch target)
- Title centered or left-aligned
- Action buttons right-aligned
- Height: 56px standard

**Floating Action Button (FAB):**
- Position: Bottom right, above bottom nav
- Size: 56x56px
- Shadow: `shadow-lg` for elevation
- Primary action per screen:
  - Dashboard: Create Session
  - Today's Matches: Quick record match
  - Rankings: (Future: Add player)

### Loading & Feedback States

**Skeleton Screens:**
- Replace spinners for better perceived performance
- Show structure of content while loading
- Match actual component layout
- Use Shadcn skeleton component

**Empty States:**
- Illustration + message + action button
- Examples:
  - "Ready to Play?" when no session exists
  - "No more matches today!" when all complete
  - "No players yet" when player list empty

**Optimistic UI Updates:**
- Show result immediately on "Save Result"
- Display loading state only if sync takes >500ms
- Revert if Firebase write fails

**Toast Notifications:**
- Success: "Match recorded successfully!"
- Error: "Failed to save. Tap to retry."
- Offline: "You're offline - changes will sync later"
- Position: Top of screen, auto-dismiss in 3-5s

---

## PWA Configuration

### Manifest File

Location: `public/manifest.json`

```json
{
  "name": "Office Ping Pong Tracker",
  "short_name": "Ping Pong",
  "description": "Track your office ping pong matches and rankings",
  "theme_color": "#2563eb",
  "background_color": "#f3f4f6",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/dashboard",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Record Match",
      "short_name": "Record",
      "description": "Quickly record a match result",
      "url": "/dashboard/today",
      "icons": [{ "src": "/icons/shortcut-record.png", "sizes": "96x96" }]
    },
    {
      "name": "View Rankings",
      "short_name": "Rankings",
      "description": "Check current player rankings",
      "url": "/dashboard/ranking",
      "icons": [{ "src": "/icons/shortcut-ranking.png", "sizes": "96x96" }]
    }
  ]
}
```

### Next.js PWA Configuration

Install: `npm install next-pwa`

**`next.config.js`:**

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    {
      urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'firebase-storage',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-data',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutes
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/avif', 'image/webp']
  }
};

module.exports = withPWA(nextConfig);
```

### Install Prompt Behavior

**When to show:**
- After 2nd visit to the app
- OR after first match is recorded successfully
- Only show once per week if dismissed

**Implementation:**

```typescript
// hooks/use-install-prompt.ts
import { useEffect, useState } from 'react';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if we should show prompt
      const visits = parseInt(localStorage.getItem('app_visits') || '0');
      const lastPrompt = localStorage.getItem('last_install_prompt');
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      if (visits >= 2 && (!lastPrompt || parseInt(lastPrompt) < weekAgo)) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Track visits
    const visits = parseInt(localStorage.getItem('app_visits') || '0');
    localStorage.setItem('app_visits', String(visits + 1));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    localStorage.setItem('last_install_prompt', String(Date.now()));
    setDeferredPrompt(null);
    setShowPrompt(false);

    return outcome === 'accepted';
  };

  const dismiss = () => {
    localStorage.setItem('last_install_prompt', String(Date.now()));
    setShowPrompt(false);
  };

  return { showPrompt, install, dismiss };
}
```

### Splash Screen

**iOS Splash Screens** (add to `app/layout.tsx` head):

```tsx
<link rel="apple-touch-startup-image" href="/splash/iphone5.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/iphone6.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/iphoneplus.png" media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" href="/splash/iphonex.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
<link rel="apple-touch-startup-image" href="/splash/iphonexr.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
<link rel="apple-touch-startup-image" href="/splash/iphonexsmax.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
```

**Design:** White background with ping pong icon centered, "Office Ping Pong" text below.

### Status Bar Theming

```tsx
// app/layout.tsx
<meta name="theme-color" content="#2563eb" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

---

## Offline Strategy

### Firebase Offline Persistence

**Enable in Firebase configuration:**

```typescript
// lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence');
    }
  });
}

export { app, db };
```

### Offline Capabilities (Balanced Approach)

**What works offline:**
- ✅ View cached dashboard data
- ✅ View today's matches (last synced state)
- ✅ View rankings (cached)
- ✅ Record match results (queued for sync)
- ✅ Browse player list
- ❌ Create new session (requires network)
- ❌ Add new players (requires network)

### Background Sync

**Match Result Queue:**

```typescript
// lib/offline/sync-queue.ts
interface QueuedMatchResult {
  id: string;
  sessionDate: string;
  matchId: string;
  result: {
    player1Score: number;
    player2Score: number;
    winnerId: string;
  };
  timestamp: number;
}

export class SyncQueue {
  private readonly QUEUE_KEY = 'match_sync_queue';

  add(matchResult: QueuedMatchResult) {
    const queue = this.getQueue();
    queue.push(matchResult);
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  getQueue(): QueuedMatchResult[] {
    const data = localStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  async syncAll() {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    const failed: QueuedMatchResult[] = [];

    for (const item of queue) {
      try {
        await recordMatchResult(item.sessionDate, item.matchId, item.result);
      } catch (error) {
        console.error('Failed to sync match:', error);
        failed.push(item);
      }
    }

    // Keep only failed items in queue
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(failed));
    return { synced: queue.length - failed.length, failed: failed.length };
  }

  clear() {
    localStorage.removeItem(this.QUEUE_KEY);
  }
}
```

**Auto-sync on connection:**

```typescript
// hooks/use-online-status.ts
import { useEffect, useState } from 'react';
import { SyncQueue } from '@/lib/offline/sync-queue';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const syncQueue = new SyncQueue();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      const result = await syncQueue.syncAll();
      if (result && result.synced > 0) {
        toast.success(`Synced ${result.synced} match result(s)`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You\'re offline - changes will sync when you\'re back online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Network Error Handling

**Retry Logic:**

```typescript
async function recordMatchResultWithRetry(
  sessionDate: string,
  matchId: string,
  result: MatchResult,
  maxRetries = 3
) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await recordMatchResult(sessionDate, matchId, result);
      return { success: true };
    } catch (error: any) {
      attempt++;

      if (error.code === 'unavailable' && attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }

      // If all retries failed or non-retryable error
      if (attempt >= maxRetries) {
        // Add to sync queue
        const syncQueue = new SyncQueue();
        syncQueue.add({
          id: crypto.randomUUID(),
          sessionDate,
          matchId,
          result,
          timestamp: Date.now()
        });

        return {
          success: false,
          queued: true,
          message: 'Saved offline. Will sync when connection returns.'
        };
      }

      throw error;
    }
  }
}
```

### Offline Indicator Component

```tsx
// components/offline-indicator.tsx
'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span>You're offline - changes will sync later</span>
    </div>
  );
}
```

---

## Performance Targets

### Lighthouse Scores (Balanced Approach)

**Target scores:**
- Performance: **≥ 85**
- Accessibility: **≥ 95**
- Best Practices: **≥ 95**
- SEO: **≥ 90**
- PWA: **≥ 90**

### Core Web Vitals

**Real-world conditions (3G connection):**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**On WiFi/4G:**
- **LCP:** < 1.5s
- **FID:** < 50ms
- **CLS:** < 0.05

### Bundle Size Targets

**Initial Load:**
- Total JavaScript: **< 200kb** (gzipped)
- CSS: **< 50kb** (gzipped)
- Fonts: **< 30kb** (WOFF2)

**Route Chunks:**
- Dashboard page: ~40kb
- Today's Matches: ~35kb
- Rankings: ~30kb
- Shared chunks: ~80kb

### Optimization Techniques

**Code Splitting:**
```typescript
// Dynamic imports for heavy components
const ChartComponent = dynamic(() => import('@/components/charts/elo-history-chart'), {
  loading: () => <Skeleton className="h-64" />,
  ssr: false
});
```

**Image Optimization:**
- Use Next.js `<Image>` component
- Serve WebP/AVIF formats
- Lazy load below-the-fold images
- Avatar images: 80x80px @2x = 160x160px actual

**Font Optimization:**
- Self-host fonts (no external requests)
- Use `font-display: swap`
- Subset to Latin characters only
- Preload critical fonts

**Component Optimization:**
```typescript
// Memoize expensive computations
const sortedPlayers = useMemo(() => {
  return players.sort((a, b) => b.eloRating - a.eloRating);
}, [players]);

// Virtualize long lists (if >50 items)
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Initialize Next.js project with App Router
- [ ] Configure Tailwind CSS + Shadcn/ui
- [ ] Set up Firebase configuration
- [ ] Implement authentication (login screen)
- [ ] Create basic layout with bottom navigation
- [ ] Deploy to Vercel (initial deployment)

### Phase 2: Core Features (Week 2)
- [ ] Player selection screen with search
- [ ] Dashboard with session overview
- [ ] Create daily session functionality
- [ ] Today's matches list (pending/completed)
- [ ] Match result recording (bottom sheet modal)

### Phase 3: Rankings & Stats (Week 3)
- [ ] Leaderboard screen with sorting
- [ ] ELO calculation integration
- [ ] Player statistics display
- [ ] Streak indicators
- [ ] Empty states for all screens

### Phase 4: PWA Features (Week 4)
- [ ] Configure next-pwa
- [ ] Create manifest.json
- [ ] Generate app icons (all sizes)
- [ ] Implement install prompt
- [ ] Add splash screens
- [ ] Test offline functionality

### Phase 5: Optimization & Polish (Week 5)
- [ ] Enable Firebase offline persistence
- [ ] Implement background sync queue
- [ ] Add loading skeletons
- [ ] Optimize images and fonts
- [ ] Add haptic feedback
- [ ] Pull-to-refresh on lists
- [ ] Performance testing (Lighthouse)

### Phase 6: Testing & Launch (Week 6)
- [ ] Manual testing on iOS Safari
- [ ] Manual testing on Android Chrome
- [ ] Test offline scenarios
- [ ] Test install flow
- [ ] Fix bugs and edge cases
- [ ] Production deployment
- [ ] User acceptance testing

---

## Success Criteria

### Technical Requirements
- ✅ Lighthouse PWA score ≥ 90
- ✅ Works offline (view data + queue changes)
- ✅ Installable on iOS and Android
- ✅ All touch targets ≥ 44px
- ✅ LCP < 2.5s on 3G
- ✅ Zero layout shift (CLS < 0.1)

### User Experience Requirements
- ✅ Feels native (smooth animations, gestures)
- ✅ Fast match recording (< 5 seconds)
- ✅ Clear visual feedback for all actions
- ✅ Intuitive navigation (no training needed)
- ✅ Works seamlessly offline and online

### Business Requirements
- ✅ Office employees can track matches easily
- ✅ Real-time ranking updates
- ✅ Historical data preserved
- ✅ No bugs in production
- ✅ Free tier Firebase costs sufficient

---

## Appendix

### Useful Resources

**Next.js PWA:**
- [next-pwa documentation](https://github.com/shadowwalker/next-pwa)
- [PWA manifest generator](https://www.simicart.com/manifest-generator.html/)
- [PWA asset generator](https://github.com/elegantapp/pwa-asset-generator)

**Firebase Offline:**
- [Firestore offline data](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Background sync patterns](https://web.dev/patterns/web-vitals-patterns/offline-ux/)

**Testing:**
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PWA testing checklist](https://web.dev/pwa-checklist/)

### Design Assets Location

All design specifications with screenshots and HTML code:
```
docs/design_specs/stitch_player_selection_screen/
├── login_screen/
│   ├── screen.png
│   └── code.html
├── player_selection_screen/
│   ├── screen.png
│   └── code.html
├── dashboard_(home)_screen/
│   ├── screen.png
│   └── code.html
├── today's_matches_screen/
│   ├── screen.png
│   └── code.html
├── match_result_recording_screen/
│   ├── screen.png
│   └── code.html
└── ranking_leaderboard_screen/
    ├── screen.png
    └── code.html
```

---

**Document Status:** ✅ Ready for Implementation
**Next Steps:** Proceed to Phase 5 (Worktree Setup) and Phase 6 (Planning Handoff)
