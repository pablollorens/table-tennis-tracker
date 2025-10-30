# Office Ping Pong Tracker - Mobile-First PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first Progressive Web App for tracking office ping pong matches with ELO rankings, offline support, and real-time sync using Next.js 14, Firebase Firestore, and Vercel deployment.

**Architecture:** Next.js 14 App Router with Shadcn/ui components for touch-optimized mobile UI. Firebase Firestore for real-time database with offline persistence. PWA with service workers for installability and offline match recording with background sync. Vercel hosting for optimal Next.js performance.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Firebase Firestore, next-pwa, Workbox, bcryptjs, date-fns, React Hook Form, Zod

**Design Reference:** See `docs/design_specs/` for all mobile UI designs and `docs/plans/2025-10-31-mobile-pwa-design.md` for PWA specifications.

---

## Table of Contents

1. [Phase 1: Project Foundation](#phase-1-project-foundation)
2. [Phase 2: Firebase & Authentication](#phase-2-firebase--authentication)
3. [Phase 3: Core Data Models & Hooks](#phase-3-core-data-models--hooks)
4. [Phase 4: Player Management](#phase-4-player-management)
5. [Phase 5: Session & Match Management](#phase-5-session--match-management)
6. [Phase 6: Rankings & Leaderboard](#phase-6-rankings--leaderboard)
7. [Phase 7: PWA Configuration](#phase-7-pwa-configuration)
8. [Phase 8: Offline Support](#phase-8-offline-support)
9. [Phase 9: Polish & Optimization](#phase-9-polish--optimization)
10. [Phase 10: Deployment](#phase-10-deployment)

---

## Phase 1: Project Foundation

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: Project root directory
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`

**Step 1: Create Next.js project with TypeScript**

```bash
npx create-next-app@latest table-tennis-tracker --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*"
cd table-tennis-tracker
```

Expected: Project created with App Router structure

**Step 2: Install core dependencies**

```bash
npm install firebase date-fns bcryptjs
npm install -D @types/bcryptjs
```

Expected: Dependencies installed successfully

**Step 3: Install Shadcn/ui**

```bash
npx shadcn@latest init
```

Select options:
- Style: Default
- Base color: Slate
- CSS variables: Yes
- Tailwind config location: tailwind.config.ts

Expected: Shadcn configured with components.json created

**Step 4: Install Shadcn components**

```bash
npx shadcn@latest add button card input label badge checkbox dialog separator toast skeleton
```

Expected: All components added to `components/ui/`

**Step 5: Verify project structure**

```bash
ls -la
```

Expected: See `app/`, `components/`, `lib/`, `public/`, `package.json`, `tsconfig.json`

**Step 6: Initial commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Shadcn/ui"
```

---

### Task 1.2: Configure Mobile-First Tailwind

**Files:**
- Modify: `tailwind.config.ts`
- Create: `app/globals.css`

**Step 1: Update Tailwind config for mobile-first**

File: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      minHeight: {
        'touch': '44px', // Minimum touch target
      },
      minWidth: {
        'touch': '44px', // Minimum touch target
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

**Step 2: Update global CSS with mobile optimizations**

File: `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  /* Mobile-first touch targets */
  .touch-target {
    @apply min-h-touch min-w-touch;
  }

  /* Safe area for notched devices */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

**Step 3: Test mobile-first setup**

```bash
npm run dev
```

Expected: Dev server runs on http://localhost:3000

**Step 4: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: configure mobile-first Tailwind with touch targets"
```

---

### Task 1.3: Create TypeScript Types

**Files:**
- Create: `types/index.ts`

**Step 1: Create core TypeScript types**

File: `types/index.ts`

```typescript
import { Timestamp } from 'firebase/firestore';

// Player Types
export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  highestElo: number;
  lowestElo: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar: string;
  eloRating: number;
  stats: PlayerStats;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Session Types
export interface Session {
  date: string; // YYYY-MM-DD
  players: string[];
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Match Types
export interface MatchPlayer {
  id: string;
  name: string;
  score: number | null;
  eloBefore: number;
  eloAfter: number | null;
  eloChange: number | null;
}

export type MatchStatus = 'pending' | 'completed' | 'skipped';

export interface Match {
  id: string;
  sessionDate: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string | null;
  status: MatchStatus;
  playedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Match History Types
export interface MatchHistory {
  id: string;
  sessionDate: string;
  player1Id: string;
  player1Name: string;
  player1Score: number;
  player1EloChange: number;
  player2Id: string;
  player2Name: string;
  player2Score: number;
  player2EloChange: number;
  winnerId: string;
  winnerName: string;
  playedAt: Timestamp;
  createdAt: Timestamp;
}

// Config Types
export interface AppConfig {
  passwordHash: string;
  currentSessionDate: string;
  eloKFactor: number;
  defaultEloRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form Types
export interface MatchResultInput {
  player1Score: number;
  player2Score: number;
  winnerId: string;
}

export interface PlayerInput {
  name: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

// ELO Calculation Types
export interface EloCalculationResult {
  winnerNewElo: number;
  loserNewElo: number;
  winnerChange: number;
  loserChange: number;
  expectedWinProbability: number;
}

export interface EloCalculationParams {
  winnerElo: number;
  loserElo: number;
  kFactor?: number;
}
```

**Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add core TypeScript type definitions"
```

---

## Phase 2: Firebase & Authentication

### Task 2.1: Configure Firebase

**Files:**
- Create: `lib/firebase/config.ts`
- Create: `.env.local`
- Modify: `.gitignore`

**Step 1: Create environment variables file**

File: `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Step 2: Update .gitignore**

File: `.gitignore` (add if not present)

```
.env.local
.env*.local
```

**Step 3: Create Firebase configuration**

File: `lib/firebase/config.ts`

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Enable offline persistence (only in browser)
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

**Step 4: Verify Firebase imports compile**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 5: Commit**

```bash
git add lib/firebase/config.ts .gitignore .env.local.example
git commit -m "feat: configure Firebase with offline persistence"
```

Note: Create `.env.local.example` with placeholder values for team reference

---

### Task 2.2: Implement Authentication Logic

**Files:**
- Create: `lib/firebase/auth.ts`

**Step 1: Create authentication utilities**

File: `lib/firebase/auth.ts`

```typescript
import bcrypt from 'bcryptjs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

const APP_PASSWORD_KEY = 'pingpong_auth';

/**
 * Verify password against stored hash in Firestore
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const storedHash = await getPasswordHashFromFirestore();
    return bcrypt.compare(password, storedHash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Save authentication session to localStorage
 */
export function saveSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_PASSWORD_KEY, 'authenticated');
  }
}

/**
 * Check if user has active session
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(APP_PASSWORD_KEY) === 'authenticated';
}

/**
 * Clear authentication session
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(APP_PASSWORD_KEY);
  }
}

/**
 * Get password hash from Firestore config
 */
async function getPasswordHashFromFirestore(): Promise<string> {
  const configRef = doc(db, 'config', 'app');
  const configSnap = await getDoc(configRef);

  if (!configSnap.exists()) {
    throw new Error('App configuration not found');
  }

  return configSnap.data()?.passwordHash || '';
}

/**
 * Admin function to update password (for initial setup)
 * Only use this once to set the initial password hash in Firestore
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
```

**Step 2: Verify authentication compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add lib/firebase/auth.ts
git commit -m "feat: implement client-side password authentication with bcrypt"
```

---

### Task 2.3: Create Login Screen Component

**Files:**
- Create: `components/auth/password-gate.tsx`
- Create: `app/page.tsx`

**Step 1: Create PasswordGate component**

File: `components/auth/password-gate.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { verifyPassword, saveSession } from '@/lib/firebase/auth';
import { EyeOff, Eye } from 'lucide-react';

export function PasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await verifyPassword(password);

      if (isValid) {
        saveSession();
        router.push('/dashboard');
      } else {
        setError('Incorrect Password. Please try again.');
      }
    } catch (err) {
      setError('Error verifying password. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏓</div>
          <h1 className="text-3xl font-bold mb-2">Office Pong</h1>
          <p className="text-gray-600">Welcome! Enter the shared password to join.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? 'border-red-500' : ''}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={loading || !password}
          >
            {loading ? 'Verifying...' : 'Enter'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

**Step 2: Create login page**

File: `app/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordGate } from '@/components/auth/password-gate';
import { isAuthenticated } from '@/lib/firebase/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  return <PasswordGate />;
}
```

**Step 3: Test login screen renders**

```bash
npm run dev
```

Navigate to http://localhost:3000

Expected: See login screen with password input

**Step 4: Commit**

```bash
git add components/auth/password-gate.tsx app/page.tsx
git commit -m "feat: create login screen with password authentication"
```

---

## Phase 3: Core Data Models & Hooks

### Task 3.1: Implement ELO Calculator

**Files:**
- Create: `lib/elo/calculator.ts`
- Create: `lib/elo/__tests__/calculator.test.ts`

**Step 1: Write ELO calculator tests**

File: `lib/elo/__tests__/calculator.test.ts`

```typescript
import { calculateEloChange, predictMatchOutcome } from '../calculator';

describe('ELO Calculator', () => {
  describe('calculateEloChange', () => {
    it('should give many points when weak player beats strong player', () => {
      const result = calculateEloChange({
        winnerElo: 1000,
        loserElo: 1400,
        kFactor: 32
      });

      expect(result.winnerChange).toBeGreaterThan(20);
      expect(result.loserChange).toBeLessThan(-20);
      expect(result.winnerNewElo).toBe(1000 + result.winnerChange);
      expect(result.loserNewElo).toBe(1400 + result.loserChange);
    });

    it('should give few points when strong player beats weak player', () => {
      const result = calculateEloChange({
        winnerElo: 1400,
        loserElo: 1000,
        kFactor: 32
      });

      expect(result.winnerChange).toBeLessThan(10);
      expect(result.loserChange).toBeGreaterThan(-10);
    });

    it('should give moderate points for evenly matched players', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1220,
        kFactor: 32
      });

      expect(Math.abs(result.winnerChange)).toBeGreaterThan(10);
      expect(Math.abs(result.winnerChange)).toBeLessThan(20);
      expect(result.winnerChange).toBe(-result.loserChange);
    });
  });

  describe('predictMatchOutcome', () => {
    it('should predict high win probability for stronger player', () => {
      const prediction = predictMatchOutcome(1400, 1000);

      expect(prediction.player1WinProbability).toBeGreaterThan(0.9);
      expect(prediction.player2WinProbability).toBeLessThan(0.1);
    });

    it('should predict 50/50 for equal ratings', () => {
      const prediction = predictMatchOutcome(1200, 1200);

      expect(prediction.player1WinProbability).toBeCloseTo(0.5, 1);
      expect(prediction.player2WinProbability).toBeCloseTo(0.5, 1);
    });

    it('should have probabilities sum to 1', () => {
      const prediction = predictMatchOutcome(1300, 1250);

      expect(
        prediction.player1WinProbability + prediction.player2WinProbability
      ).toBeCloseTo(1);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- lib/elo/__tests__/calculator.test.ts
```

Expected: FAIL - calculator module not found

**Step 3: Implement ELO calculator**

File: `lib/elo/calculator.ts`

```typescript
import { EloCalculationResult, EloCalculationParams } from '@/types';

/**
 * Calculate ELO rating changes after a match
 * Based on standard ELO formula: R_new = R_old + K * (S - E)
 * where S is actual score (1 for win, 0 for loss)
 * and E is expected score based on rating difference
 */
export function calculateEloChange({
  winnerElo,
  loserElo,
  kFactor = 32
}: EloCalculationParams): EloCalculationResult {
  // Calculate expected win probability for each player
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  // Calculate ELO changes (winner gets S=1, loser gets S=0)
  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));

  // Calculate new ratings
  const winnerNewElo = Math.round(winnerElo + winnerChange);
  const loserNewElo = Math.round(loserElo + loserChange);

  return {
    winnerNewElo,
    loserNewElo,
    winnerChange,
    loserChange,
    expectedWinProbability: expectedWinner
  };
}

/**
 * Predict match outcome between two players
 */
export function predictMatchOutcome(player1Elo: number, player2Elo: number): {
  player1WinProbability: number;
  player2WinProbability: number;
  expectedPointsGain: number;
} {
  const player1WinProb = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
  const player2WinProb = 1 - player1WinProb;

  // Expected points if player1 wins
  const expectedPoints = Math.round(32 * (1 - player1WinProb));

  return {
    player1WinProbability: Math.round(player1WinProb * 100) / 100,
    player2WinProbability: Math.round(player2WinProb * 100) / 100,
    expectedPointsGain: expectedPoints
  };
}

/**
 * Get description of ELO change magnitude
 */
export function getEloChangeDescription(change: number): string {
  const absChange = Math.abs(change);

  if (absChange >= 30) return 'Cambio masivo';
  if (absChange >= 20) return 'Cambio grande';
  if (absChange >= 10) return 'Cambio moderado';
  if (absChange >= 5) return 'Cambio pequeño';
  return 'Cambio mínimo';
}

/**
 * Get Tailwind color class for ELO change
 */
export function getEloChangeColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- lib/elo/__tests__/calculator.test.ts
```

Expected: PASS - all tests green

**Step 5: Commit**

```bash
git add lib/elo/calculator.ts lib/elo/__tests__/calculator.test.ts
git commit -m "feat: implement ELO rating calculator with tests"
```

---

### Task 3.2: Create Round-Robin Generator

**Files:**
- Create: `lib/utils/round-robin.ts`
- Create: `lib/utils/__tests__/round-robin.test.ts`

**Step 1: Write round-robin tests**

File: `lib/utils/__tests__/round-robin.test.ts`

```typescript
import { generateRoundRobin, calculateTotalMatches } from '../round-robin';

describe('Round Robin Generator', () => {
  describe('generateRoundRobin', () => {
    it('should generate correct matches for 3 players', () => {
      const matches = generateRoundRobin(['p1', 'p2', 'p3']);

      expect(matches).toHaveLength(3);
      expect(matches).toContainEqual({ player1Id: 'p1', player2Id: 'p2' });
      expect(matches).toContainEqual({ player1Id: 'p1', player2Id: 'p3' });
      expect(matches).toContainEqual({ player1Id: 'p2', player2Id: 'p3' });
    });

    it('should generate correct matches for 4 players', () => {
      const matches = generateRoundRobin(['p1', 'p2', 'p3', 'p4']);

      expect(matches).toHaveLength(6);
    });

    it('should not include duplicate pairings', () => {
      const matches = generateRoundRobin(['p1', 'p2', 'p3']);
      const pairings = matches.map(m => `${m.player1Id}-${m.player2Id}`);
      const uniquePairings = new Set(pairings);

      expect(pairings.length).toBe(uniquePairings.size);
    });

    it('should handle 2 players (minimum)', () => {
      const matches = generateRoundRobin(['p1', 'p2']);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ player1Id: 'p1', player2Id: 'p2' });
    });
  });

  describe('calculateTotalMatches', () => {
    it('should calculate correct number for various player counts', () => {
      expect(calculateTotalMatches(2)).toBe(1);
      expect(calculateTotalMatches(3)).toBe(3);
      expect(calculateTotalMatches(4)).toBe(6);
      expect(calculateTotalMatches(5)).toBe(10);
      expect(calculateTotalMatches(6)).toBe(15);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- lib/utils/__tests__/round-robin.test.ts
```

Expected: FAIL - module not found

**Step 3: Implement round-robin generator**

File: `lib/utils/round-robin.ts`

```typescript
export interface MatchPairing {
  player1Id: string;
  player2Id: string;
}

/**
 * Generate all possible match combinations between players (round-robin)
 * Each player plays every other player exactly once
 */
export function generateRoundRobin(playerIds: string[]): MatchPairing[] {
  const matches: MatchPairing[] = [];

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({
        player1Id: playerIds[i],
        player2Id: playerIds[j]
      });
    }
  }

  return matches;
}

/**
 * Calculate total number of matches for N players
 * Formula: n * (n - 1) / 2
 *
 * Examples:
 * - 2 players → 1 match
 * - 3 players → 3 matches
 * - 4 players → 6 matches
 * - 5 players → 10 matches
 */
export function calculateTotalMatches(numPlayers: number): number {
  return (numPlayers * (numPlayers - 1)) / 2;
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- lib/utils/__tests__/round-robin.test.ts
```

Expected: PASS - all tests green

**Step 5: Commit**

```bash
git add lib/utils/round-robin.ts lib/utils/__tests__/round-robin.test.ts
git commit -m "feat: implement round-robin match generator with tests"
```

---

### Task 3.3: Create Custom React Hooks

**Files:**
- Create: `hooks/use-players.ts`
- Create: `hooks/use-session.ts`
- Create: `hooks/use-matches.ts`
- Create: `hooks/use-online-status.ts`

**Step 1: Create usePlayers hook**

File: `hooks/use-players.ts`

```typescript
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Player } from '@/types';

export function usePlayers(activeOnly: boolean = true) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const playersRef = collection(db, 'players');

    let q = query(playersRef, orderBy('eloRating', 'desc'));

    if (activeOnly) {
      q = query(
        playersRef,
        where('isActive', '==', true),
        orderBy('eloRating', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        setPlayers(playersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching players:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOnly]);

  return { players, loading, error };
}
```

**Step 2: Create useCurrentSession hook**

File: `hooks/use-session.ts`

```typescript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Session } from '@/types';
import { format } from 'date-fns';

export function useCurrentSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sessionRef = doc(db, 'sessions', today);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession({ date: today, ...snapshot.data() } as Session);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching session:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { session, loading, error };
}
```

**Step 3: Create useTodayMatches hook**

File: `hooks/use-matches.ts`

```typescript
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Match } from '@/types';
import { format } from 'date-fns';

export function useTodayMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const matchesRef = collection(db, `sessions/${today}/matches`);
    const q = query(matchesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Match[];

        setMatches(matchesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching matches:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { matches, loading, error };
}
```

**Step 4: Create useOnlineStatus hook**

File: `hooks/use-online-status.ts`

```typescript
import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

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

**Step 5: Verify hooks compile**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 6: Commit**

```bash
git add hooks/
git commit -m "feat: create custom React hooks for Firebase data"
```

---

## Phase 4: Player Management

### Task 4.1: Create Firestore Player Functions

**Files:**
- Create: `lib/firebase/players.ts`

**Step 1: Implement player CRUD functions**

File: `lib/firebase/players.ts`

```typescript
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { PlayerInput, Player } from '@/types';

/**
 * Create a new player
 */
export async function createPlayer(playerData: PlayerInput): Promise<Player> {
  const playersRef = collection(db, 'players');

  // Generate initials for avatar
  const initials = playerData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const newPlayer = {
    name: playerData.name,
    nickname: playerData.nickname || null,
    email: playerData.email || null,
    avatar: playerData.avatar || initials,
    eloRating: 1200, // Default starting ELO
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      highestElo: 1200,
      lowestElo: 1200,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(playersRef, newPlayer);

  return {
    id: docRef.id,
    ...newPlayer,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  } as Player;
}

/**
 * Get player data by ID
 */
export async function getPlayerData(playerId: string): Promise<Player> {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    throw new Error(`Player not found: ${playerId}`);
  }

  return {
    id: playerSnap.id,
    ...playerSnap.data()
  } as Player;
}

/**
 * Update player statistics after a match
 */
export async function updatePlayerStats(
  playerId: string,
  matchResult: 'win' | 'loss',
  eloChange: number
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const player = playerSnap.data() as Player;
  const newElo = player.eloRating + eloChange;
  const newTotalMatches = player.stats.totalMatches + 1;
  const newWins = matchResult === 'win' ? player.stats.wins + 1 : player.stats.wins;
  const newLosses = matchResult === 'loss' ? player.stats.losses + 1 : player.stats.losses;
  const newWinRate = newWins / newTotalMatches;

  // Calculate new streak
  let newStreak = player.stats.currentStreak;
  if (matchResult === 'win') {
    newStreak = newStreak >= 0 ? newStreak + 1 : 1;
  } else {
    newStreak = newStreak <= 0 ? newStreak - 1 : -1;
  }

  const updates = {
    eloRating: newElo,
    'stats.totalMatches': newTotalMatches,
    'stats.wins': newWins,
    'stats.losses': newLosses,
    'stats.winRate': newWinRate,
    'stats.highestElo': Math.max(player.stats.highestElo, newElo),
    'stats.lowestElo': Math.min(player.stats.lowestElo, newElo),
    'stats.currentStreak': newStreak,
    'stats.longestWinStreak': matchResult === 'win'
      ? Math.max(player.stats.longestWinStreak, Math.abs(newStreak))
      : player.stats.longestWinStreak,
    'stats.longestLoseStreak': matchResult === 'loss'
      ? Math.max(player.stats.longestLoseStreak, Math.abs(newStreak))
      : player.stats.longestLoseStreak,
    updatedAt: serverTimestamp()
  };

  await updateDoc(playerRef, updates);
}
```

**Step 2: Verify functions compile**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add lib/firebase/players.ts
git commit -m "feat: implement Firestore player CRUD functions"
```

---

### Task 4.2: Create Player Selection Component

**Files:**
- Create: `components/players/player-selector.tsx`
- Create: `app/dashboard/player-selection/page.tsx`

**Step 1: Create PlayerSelector component**

File: `components/players/player-selector.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlayers } from '@/hooks/use-players';
import { calculateTotalMatches } from '@/lib/utils/round-robin';
import { Search, ArrowLeft } from 'lucide-react';

export function PlayerSelector() {
  const { players, loading } = usePlayers();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.nickname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === filteredPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(filteredPlayers.map(p => p.id));
    }
  };

  const handleCreateSession = async () => {
    if (selectedPlayers.length < 2) {
      alert('Please select at least 2 players');
      return;
    }

    setCreating(true);
    try {
      // TODO: Implement createDailySession function
      // await createDailySession(selectedPlayers);
      router.push('/dashboard');
    } catch (error) {
      alert('Error creating session: ' + (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading players...</div>
      </div>
    );
  }

  const totalMatches = calculateTotalMatches(selectedPlayers.length);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="touch-target p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold flex-1">Today's Players</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for a player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Player Count & Select All */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Players ({filteredPlayers.length})
          </div>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 font-medium"
          >
            Select all
          </button>
        </div>

        {/* Player List */}
        <div className="space-y-2">
          {filteredPlayers.map(player => (
            <div
              key={player.id}
              className="flex items-center gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                {player.avatar}
              </div>
              <div className="flex-1">
                <div className="font-medium">{player.name}</div>
                <div className="text-sm text-gray-500">ELO: {player.eloRating}</div>
              </div>
              <Checkbox
                checked={selectedPlayers.includes(player.id)}
                onCheckedChange={() => handleTogglePlayer(player.id)}
                className="w-6 h-6"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fixed Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-bottom">
        <div className="max-w-2xl mx-auto space-y-4">
          {selectedPlayers.length >= 2 && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedPlayers.length} players selected → Generates {totalMatches} matches
              </p>
            </div>
          )}
          <Button
            onClick={handleCreateSession}
            disabled={selectedPlayers.length < 2 || creating}
            className="w-full h-14 text-base"
          >
            {creating ? 'Creating Session...' : 'Create Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create player selection page**

File: `app/dashboard/player-selection/page.tsx`

```typescript
import { PlayerSelector } from '@/components/players/player-selector';

export default function PlayerSelectionPage() {
  return <PlayerSelector />;
}
```

**Step 3: Test player selection screen**

```bash
npm run dev
```

Navigate to http://localhost:3000/dashboard/player-selection

Expected: See player selection screen (will show empty until players exist in Firestore)

**Step 4: Commit**

```bash
git add components/players/player-selector.tsx app/dashboard/player-selection/page.tsx
git commit -m "feat: create player selection component with search"
```

---

## Phase 5: Session & Match Management

### Task 5.1: Create Session Management Functions

**Files:**
- Create: `lib/firebase/sessions.ts`

**Step 1: Implement session functions**

File: `lib/firebase/sessions.ts`

```typescript
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { generateRoundRobin } from '@/lib/utils/round-robin';
import { getPlayerData } from './players';
import { format } from 'date-fns';

/**
 * Create a new daily session with round-robin matches
 */
export async function createDailySession(selectedPlayerIds: string[]): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const sessionRef = doc(db, 'sessions', today);

  // Check if session already exists
  const sessionSnap = await getDoc(sessionRef);
  if (sessionSnap.exists()) {
    throw new Error('A session already exists for today');
  }

  // Generate all match pairings
  const matchPairings = generateRoundRobin(selectedPlayerIds);

  // Create session document
  const session = {
    date: today,
    players: selectedPlayerIds,
    totalMatches: matchPairings.length,
    completedMatches: 0,
    pendingMatches: matchPairings.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(sessionRef, session);

  // Create match documents in subcollection
  const matchesRef = collection(db, `sessions/${today}/matches`);

  for (const pairing of matchPairings) {
    const player1Data = await getPlayerData(pairing.player1Id);
    const player2Data = await getPlayerData(pairing.player2Id);

    const match = {
      sessionDate: today,
      player1: {
        id: pairing.player1Id,
        name: player1Data.name,
        score: null,
        eloBefore: player1Data.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: pairing.player2Id,
        name: player2Data.name,
        score: null,
        eloBefore: player2Data.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      winnerId: null,
      status: 'pending',
      playedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(matchesRef, match);
  }
}

/**
 * Update session match counters
 */
export async function updateSessionCounters(
  sessionDate: string,
  completedChange: number
): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionDate);
  await updateDoc(sessionRef, {
    completedMatches: increment(completedChange),
    pendingMatches: increment(-completedChange),
    updatedAt: serverTimestamp()
  });
}
```

**Step 2: Update PlayerSelector to use createDailySession**

File: `components/players/player-selector.tsx`

Replace the TODO section with:

```typescript
import { createDailySession } from '@/lib/firebase/sessions';

// ... in handleCreateSession function:
try {
  await createDailySession(selectedPlayers);
  router.push('/dashboard');
} catch (error) {
  alert('Error creating session: ' + (error as Error).message);
}
```

**Step 3: Verify functions compile**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add lib/firebase/sessions.ts components/players/player-selector.tsx
git commit -m "feat: implement session creation with round-robin matches"
```

---

### Task 5.2: Create Match Result Recording

**Files:**
- Create: `lib/firebase/matches.ts`

**Step 1: Implement match recording function**

File: `lib/firebase/matches.ts`

```typescript
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { MatchResultInput } from '@/types';
import { calculateEloChange } from '@/lib/elo/calculator';
import { updatePlayerStats } from './players';
import { updateSessionCounters } from './sessions';

/**
 * Record the result of a match
 */
export async function recordMatchResult(
  sessionDate: string,
  matchId: string,
  result: MatchResultInput
): Promise<void> {
  const matchRef = doc(db, `sessions/${sessionDate}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Match not found');
  }

  const match = matchSnap.data();

  // Validate match is pending
  if (match.status !== 'pending') {
    throw new Error('Match has already been recorded');
  }

  // Determine winner and loser
  const isPlayer1Winner = result.winnerId === match.player1.id;
  const winnerData = isPlayer1Winner ? match.player1 : match.player2;
  const loserData = isPlayer1Winner ? match.player2 : match.player1;

  // Calculate ELO changes
  const eloResult = calculateEloChange({
    winnerElo: winnerData.eloBefore,
    loserElo: loserData.eloBefore,
    kFactor: 32
  });

  // Update match document
  const updates = {
    'player1.score': result.player1Score,
    'player1.eloAfter': isPlayer1Winner ? eloResult.winnerNewElo : eloResult.loserNewElo,
    'player1.eloChange': isPlayer1Winner ? eloResult.winnerChange : eloResult.loserChange,
    'player2.score': result.player2Score,
    'player2.eloAfter': isPlayer1Winner ? eloResult.loserNewElo : eloResult.winnerNewElo,
    'player2.eloChange': isPlayer1Winner ? eloResult.loserChange : eloResult.winnerChange,
    winnerId: result.winnerId,
    status: 'completed',
    playedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await updateDoc(matchRef, updates);

  // Update player statistics
  await updatePlayerStats(
    winnerData.id,
    'win',
    isPlayer1Winner ? eloResult.winnerChange : eloResult.winnerChange
  );

  await updatePlayerStats(
    loserData.id,
    'loss',
    isPlayer1Winner ? eloResult.loserChange : eloResult.loserChange
  );

  // Update session counters
  await updateSessionCounters(sessionDate, 1);
}
```

**Step 2: Verify function compiles**

```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add lib/firebase/matches.ts
git commit -m "feat: implement match result recording with ELO updates"
```

---

Due to length constraints, I'll provide the implementation plan structure. The plan should continue with:

## Phase 6: Rankings & Leaderboard (Tasks 6.1-6.2)
## Phase 7: PWA Configuration (Tasks 7.1-7.3)
## Phase 8: Offline Support (Tasks 8.1-8.2)
## Phase 9: Polish & Optimization (Tasks 9.1-9.3)
## Phase 10: Deployment (Tasks 10.1-10.2)

Would you like me to continue with the remaining phases in detail, or is this level of granularity sufficient for the implementation plan?
