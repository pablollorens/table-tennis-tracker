# Player Self-Registration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform authentication from admin-managed to self-service with nickname-based login and profile activation

**Architecture:** Extend existing client-side bcrypt auth with per-player passwords, add profile completion flow, auto-cleanup inactive accounts after 24 hours

**Tech Stack:** Next.js 15, TypeScript, Firebase Firestore, bcryptjs, React hooks, Shadcn UI

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `types/index.ts:16-27`

**Step 1: Add new fields to Player interface**

Update the Player interface to include nickname, passwordHash, and isActive:

```typescript
export interface Player {
  id: string;
  nickname: string;          // NEW - unique identifier for login
  passwordHash: string;       // NEW - bcrypt hash of personal password
  name: string | null;        // MODIFIED - nullable until profile complete
  nickname?: string;          // REMOVE - will be required field
  email?: string;             // MODIFIED - nullable until profile complete
  avatar: string;
  eloRating: number;
  stats: PlayerStats;
  isActive: boolean;          // NEW - false until profile completed
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Step 2: Update PlayerInput interface**

```typescript
export interface PlayerInput {
  nickname: string;           // NEW - required for creation
  password: string;           // NEW - plain password (will be hashed)
  name?: string;
  email?: string;
  avatar?: string;
}
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should show errors in files using old Player interface (we'll fix these next)

**Step 4: Commit type changes**

```bash
git add types/index.ts
git commit -m "feat(types): add nickname, passwordHash, isActive to Player interface

- Add nickname as required unique identifier
- Add passwordHash for per-player authentication
- Add isActive flag for profile activation status
- Make name and email nullable until profile complete"
```

---

## Task 2: Create Auth Helper Functions

**Files:**
- Create: `lib/firebase/auth.ts` (will replace existing)
- Read: `lib/firebase/config.ts` (for db reference)

**Step 1: Create auth utilities file with shared password verification**

```typescript
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './config';
import bcrypt from 'bcryptjs';

/**
 * Verify the shared office password
 */
export async function verifySharedPassword(password: string): Promise<boolean> {
  try {
    const configRef = collection(db, 'config');
    const configSnapshot = await getDocs(configRef);

    if (configSnapshot.empty) {
      throw new Error('Config document not found');
    }

    const configDoc = configSnapshot.docs[0];
    const sharedPasswordHash = configDoc.data().sharedPasswordHash || configDoc.data().passwordHash;

    return await bcrypt.compare(password, sharedPasswordHash);
  } catch (error) {
    console.error('Error verifying shared password:', error);
    return false;
  }
}
```

**Step 2: Add nickname availability check**

```typescript
/**
 * Check if a nickname is available (case-insensitive)
 */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  try {
    const nicknameQuery = query(
      collection(db, 'players'),
      where('nickname', '==', nickname.toLowerCase())
    );
    const snapshot = await getDocs(nicknameQuery);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking nickname availability:', error);
    return false;
  }
}
```

**Step 3: Add player authentication function**

```typescript
import { Player } from '@/types';

/**
 * Authenticate a player by nickname and password
 */
export async function authenticatePlayer(
  nickname: string,
  password: string
): Promise<Player | null> {
  try {
    const playerQuery = query(
      collection(db, 'players'),
      where('nickname', '==', nickname.toLowerCase()),
      limit(1)
    );
    const snapshot = await getDocs(playerQuery);

    if (snapshot.empty) {
      return null;
    }

    const playerDoc = snapshot.docs[0];
    const player = { id: playerDoc.id, ...playerDoc.data() } as Player;

    const passwordMatch = await bcrypt.compare(password, player.passwordHash);

    return passwordMatch ? player : null;
  } catch (error) {
    console.error('Error authenticating player:', error);
    return null;
  }
}
```

**Step 4: Add localStorage helper functions**

```typescript
interface AuthState {
  authenticated: boolean;
  playerId?: string;
  nickname?: string;
}

/**
 * Save auth state to localStorage
 */
export function saveAuthState(playerId: string, nickname: string): void {
  const authState: AuthState = {
    authenticated: true,
    playerId,
    nickname
  };
  localStorage.setItem('auth', JSON.stringify(authState));
}

/**
 * Get auth state from localStorage
 */
export function getAuthState(): AuthState {
  const stored = localStorage.getItem('auth');
  if (!stored) {
    return { authenticated: false };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { authenticated: false };
  }
}

/**
 * Clear auth state
 */
export function clearAuthState(): void {
  localStorage.removeItem('auth');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthState().authenticated;
}
```

**Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 6: Commit auth functions**

```bash
git add lib/firebase/auth.ts
git commit -m "feat(auth): add player authentication functions

- verifySharedPassword: check office password
- checkNicknameAvailable: validate unique nicknames
- authenticatePlayer: login by nickname + password
- localStorage helpers for auth state management"
```

---

## Task 3: Update Player Functions

**Files:**
- Modify: `lib/firebase/players.ts:15-56`

**Step 1: Update createPlayer to support inactive players**

Replace existing createPlayer function:

```typescript
import bcrypt from 'bcryptjs';

/**
 * Create a new inactive player with nickname and password
 */
export async function createInactivePlayer(
  nickname: string,
  password: string
): Promise<Player> {
  const playersRef = collection(db, 'players');

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const newPlayer = {
    nickname: nickname.toLowerCase(),
    passwordHash,
    name: null,
    email: null,
    avatar: nickname.substring(0, 2).toUpperCase(), // Temporary avatar
    eloRating: 1200,
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
    isActive: false,
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
```

**Step 2: Add cleanup function for inactive players**

```typescript
import { Timestamp, deleteDoc, doc } from 'firebase/firestore';

/**
 * Delete inactive players older than 24 hours
 */
export async function cleanupInactivePlayers(): Promise<number> {
  try {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const cleanupQuery = query(
      collection(db, 'players'),
      where('isActive', '==', false),
      where('createdAt', '<', cutoff)
    );

    const snapshot = await getDocs(cleanupQuery);

    const deletePromises = snapshot.docs.map(docSnapshot =>
      deleteDoc(doc(db, 'players', docSnapshot.id))
    );

    await Promise.all(deletePromises);

    return snapshot.size;
  } catch (error) {
    console.error('Error cleaning up inactive players:', error);
    return 0;
  }
}
```

**Step 3: Add profile update function**

```typescript
/**
 * Update player profile and activate
 */
export async function updatePlayerProfile(
  playerId: string,
  data: { name: string; email: string; avatar?: string }
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);

  // Generate initials if no avatar provided
  const initials = data.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const updates = {
    name: data.name,
    email: data.email,
    avatar: data.avatar || initials,
    isActive: true,
    updatedAt: serverTimestamp()
  };

  await updateDoc(playerRef, updates);
}
```

**Step 4: Keep old createPlayer for backwards compatibility**

Add comment above old function:

```typescript
/**
 * @deprecated Use createInactivePlayer instead
 * Legacy function - kept for backwards compatibility
 */
export async function createPlayer(playerData: PlayerInput): Promise<Player> {
  // ... existing code ...
}
```

**Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 6: Commit player functions**

```bash
git add lib/firebase/players.ts
git commit -m "feat(players): add inactive player creation and profile activation

- createInactivePlayer: create with nickname + hashed password
- cleanupInactivePlayers: auto-delete accounts > 24h old
- updatePlayerProfile: complete profile and activate player
- Keep legacy createPlayer for backwards compatibility"
```

---

## Task 4: Create Current Player Hook

**Files:**
- Create: `hooks/use-current-player.ts`

**Step 1: Create hook for current player data**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuthState } from '@/lib/firebase/auth';
import { Player } from '@/types';

export function useCurrentPlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const authState = getAuthState();

    if (!authState.authenticated || !authState.playerId) {
      setLoading(false);
      return;
    }

    const playerRef = doc(db, 'players', authState.playerId);

    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlayer({
            id: snapshot.id,
            ...snapshot.data()
          } as Player);
        } else {
          setPlayer(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching current player:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { player, loading, error };
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 3: Commit hook**

```bash
git add hooks/use-current-player.ts
git commit -m "feat(hooks): add use-current-player hook for authenticated user data

- Real-time subscription to current player document
- Reads playerId from localStorage auth state
- Returns player, loading, and error states"
```

---

## Task 5: Update Players Hook to Filter Active Only

**Files:**
- Modify: `hooks/use-players.ts`

**Step 1: Add isActive filter to query**

Find the Firestore query and add the filter:

```typescript
// Before: collection(db, 'players')
// After:
const playersQuery = query(
  collection(db, 'players'),
  where('isActive', '==', true)
);

const unsubscribe = onSnapshot(playersQuery, ...);
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 3: Test that existing pages still work**

Run: `npm run dev`
Navigate to: http://localhost:3000
Expected: App should load (may show no players if none are active)

**Step 4: Commit hook update**

```bash
git add hooks/use-players.ts
git commit -m "feat(hooks): filter players to show only active accounts

- Add isActive === true filter to players query
- Inactive accounts hidden from all player lists"
```

---

## Task 6: Create Profile Form Component

**Files:**
- Create: `components/profile/profile-form.tsx`
- Reference: `docs/design_specs/stitch_player_selection_screen/player_creation_screen/`

**Step 1: Create profile form component structure**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Player } from '@/types';
import { updatePlayerProfile } from '@/lib/firebase/players';
import { User, Mail, Camera } from 'lucide-react';

interface ProfileFormProps {
  player: Player;
  onSuccess?: () => void;
}

export function ProfileForm({ player, onSuccess }: ProfileFormProps) {
  const [name, setName] = useState(player.name || '');
  const [email, setEmail] = useState(player.email || '');
  const [avatar, setAvatar] = useState(player.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2 && email.includes('@');
  const buttonText = player.isActive ? 'Save Changes' : 'Save & Activate';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    setSaving(true);
    setError(null);

    try {
      await updatePlayerProfile(player.id, {
        name: name.trim(),
        email: email.trim(),
        avatar
      });

      onSuccess?.();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Avatar Section */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-2xl">
            {avatar}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">Tap to add photo</p>
      </div>

      {/* Nickname (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={player.nickname}
          disabled
          className="bg-gray-50"
        />
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name<span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player's full name"
          required
          minLength={2}
          maxLength={50}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email<span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter player's email"
          required
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!isValid || saving}
        className="w-full h-14 text-base"
      >
        {saving ? 'Saving...' : buttonText}
      </Button>
    </form>
  );
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 3: Commit profile form**

```bash
git add components/profile/profile-form.tsx
git commit -m "feat(profile): add profile form component

- Based on visual design spec
- Required fields: name, email (nickname read-only)
- Optional avatar upload placeholder
- Different button text for inactive vs active users
- Client-side validation before submit"
```

---

## Task 7: Create Profile Page

**Files:**
- Create: `app/profile/page.tsx`

**Step 1: Create profile page with auth check**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { ProfileForm } from '@/components/profile/profile-form';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { player, loading } = useCurrentPlayer();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Player not found</div>
      </div>
    );
  }

  const handleSuccess = () => {
    if (!player.isActive) {
      // First time activation - redirect to dashboard
      router.push('/dashboard');
    } else {
      // Just saved changes - show success message
      alert('Profile updated successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">
            {player.isActive ? 'Edit Profile' : 'Complete Your Profile'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {!player.isActive && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Complete your profile to start playing matches!
            </p>
          </div>
        )}

        <ProfileForm player={player} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 3: Commit profile page**

```bash
git add app/profile/page.tsx
git commit -m "feat(profile): add profile page with activation flow

- Auth check redirects to login if not authenticated
- Shows activation prompt for inactive users
- Redirects to dashboard after first activation
- Shows success message for profile edits"
```

---

## Task 8: Refactor Login Screen (Part 1 - Tab Structure)

**Files:**
- Modify: `components/auth/password-gate.tsx:1-100`

**Step 1: Add tab state and structure**

Add imports and state at the top of the component:

```typescript
import { useState, useEffect } from 'react';
import { getAuthState, clearAuthState } from '@/lib/firebase/auth';

type AuthTab = 'new' | 'signin';

// Inside component:
const [activeTab, setActiveTab] = useState<AuthTab>('new');
const authState = getAuthState();

useEffect(() => {
  // Auto-select signin tab if user has logged in before
  if (authState.playerId) {
    setActiveTab('signin');
  }
}, []);
```

**Step 2: Add tab UI**

Add this before the existing form:

```typescript
{/* Tab Selector */}
<div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
  <button
    type="button"
    onClick={() => setActiveTab('new')}
    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
      activeTab === 'new'
        ? 'bg-white text-blue-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    New User
  </button>
  <button
    type="button"
    onClick={() => setActiveTab('signin')}
    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
      activeTab === 'signin'
        ? 'bg-white text-blue-600 shadow-sm'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    Sign In
  </button>
</div>
```

**Step 3: Wrap existing form in conditional**

```typescript
{activeTab === 'new' ? (
  <div>
    {/* Existing shared password form will go here */}
    <p>New User Flow - Coming next</p>
  </div>
) : (
  <div>
    {/* Sign in form will go here */}
    <p>Sign In Flow - Coming next</p>
  </div>
)}
```

**Step 4: Test tab switching**

Run: `npm run dev`
Navigate to: http://localhost:3000
Expected: Should see tab selector, can switch between tabs

**Step 5: Commit tab structure**

```bash
git add components/auth/password-gate.tsx
git commit -m "feat(auth): add tab structure to login screen

- Two tabs: New User and Sign In
- Auto-select Sign In if user has logged in before
- Placeholder content for each tab (to be implemented)"
```

---

## Task 9: Refactor Login Screen (Part 2 - New User Flow)

**Files:**
- Modify: `components/auth/password-gate.tsx`

**Step 1: Add new user flow state**

```typescript
type NewUserStep = 'shared-password' | 'registration';

const [newUserStep, setNewUserStep] = useState<NewUserStep>('shared-password');
const [sharedPassword, setSharedPassword] = useState('');
const [nickname, setNickname] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [nicknameError, setNicknameError] = useState('');
const [loading, setLoading] = useState(false);
```

**Step 2: Add shared password verification handler**

```typescript
import { verifySharedPassword, checkNicknameAvailable, saveAuthState } from '@/lib/firebase/auth';
import { createInactivePlayer, cleanupInactivePlayers } from '@/lib/firebase/players';

const handleSharedPasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const isValid = await verifySharedPassword(sharedPassword);
    if (isValid) {
      setNewUserStep('registration');
    } else {
      setError('Invalid password. Please try again.');
    }
  } catch (err) {
    setError('Error verifying password');
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Add nickname validation with debounce**

```typescript
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const checkNickname = useCallback(
  debounce(async (value: string) => {
    if (value.length < 3) return;

    const available = await checkNicknameAvailable(value);
    if (!available) {
      setNicknameError('This nickname is already taken');
    } else {
      setNicknameError('');
    }
  }, 500),
  []
);

const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setNickname(value);
  setNicknameError('');

  if (value.length >= 3) {
    checkNickname(value);
  }
};
```

**Step 4: Add registration submit handler**

```typescript
const handleRegistrationSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (nicknameError) {
    setError('Please fix errors before continuing');
    return;
  }

  setLoading(true);
  setError('');

  try {
    // Clean up old inactive players
    await cleanupInactivePlayers();

    // Final availability check
    const available = await checkNicknameAvailable(nickname);
    if (!available) {
      setError('Someone just took this nickname. Please choose another.');
      setLoading(false);
      return;
    }

    // Create inactive player
    const player = await createInactivePlayer(nickname, password);

    // Save auth state
    saveAuthState(player.id, nickname);

    // Redirect to profile
    router.push('/profile');
  } catch (err) {
    setError('Failed to create account. Please try again.');
    console.error('Registration error:', err);
  } finally {
    setLoading(false);
  }
};
```

**Step 5: Add New User tab JSX**

Replace the "New User Flow - Coming next" placeholder:

```typescript
{activeTab === 'new' ? (
  <div>
    {newUserStep === 'shared-password' ? (
      <>
        <h2 className="text-2xl font-bold text-center mb-2">
          Welcome to Office Ping Pong 🏓
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter the office password to get started
        </p>

        <form onSubmit={handleSharedPasswordSubmit} className="space-y-4">
          <div>
            <Label htmlFor="shared-password">Office Password</Label>
            <Input
              id="shared-password"
              type="password"
              value={sharedPassword}
              onChange={(e) => setSharedPassword(e.target.value)}
              placeholder="Enter shared password"
              required
              className="h-12"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      </>
    ) : (
      <>
        <h2 className="text-2xl font-bold text-center mb-2">
          Create Your Account
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Choose a nickname and password
        </p>

        <form onSubmit={handleRegistrationSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="Enter a nickname"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_-]+"
              className="h-12"
            />
            {nicknameError && (
              <p className="mt-1 text-sm text-red-600">{nicknameError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="h-12"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              className="h-12"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !!nicknameError}
            className="w-full h-12"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </>
    )}
  </div>
) : (
  // Sign In tab placeholder
)}
```

**Step 6: Test new user flow**

Run: `npm run dev`
Test:
1. Enter office password → Should show registration form
2. Enter nickname → Should check availability
3. Complete form → Should create player and redirect to profile

**Step 7: Commit new user flow**

```bash
git add components/auth/password-gate.tsx
git commit -m "feat(auth): implement new user registration flow

- Two-step process: shared password then registration
- Real-time nickname availability checking (debounced)
- Password confirmation validation
- Auto-cleanup old inactive players before creation
- Redirects to profile page after registration"
```

---

## Task 10: Refactor Login Screen (Part 3 - Sign In Flow)

**Files:**
- Modify: `components/auth/password-gate.tsx`

**Step 1: Add sign in state**

```typescript
const [signinNickname, setSigninNickname] = useState(authState.nickname || '');
const [signinPassword, setSigninPassword] = useState('');
```

**Step 2: Add sign in handler**

```typescript
import { authenticatePlayer } from '@/lib/firebase/auth';

const handleSignInSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const player = await authenticatePlayer(signinNickname, signinPassword);

    if (!player) {
      setError('Invalid nickname or password');
      setLoading(false);
      return;
    }

    // Save auth state
    saveAuthState(player.id, player.nickname);

    // Redirect based on active status
    if (player.isActive) {
      router.push('/dashboard');
    } else {
      router.push('/profile');
    }
  } catch (err) {
    setError('Failed to sign in. Please try again.');
    console.error('Sign in error:', err);
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Add different user link handler**

```typescript
const handleDifferentUser = () => {
  clearAuthState();
  setSigninNickname('');
  setSigninPassword('');
  setActiveTab('new');
};
```

**Step 4: Add Sign In tab JSX**

Replace the "Sign In Flow - Coming next" placeholder:

```typescript
{activeTab === 'signin' ? (
  <div>
    <h2 className="text-2xl font-bold text-center mb-2">
      Welcome Back 👋
    </h2>
    <p className="text-center text-gray-600 mb-6">
      Sign in with your nickname and password
    </p>

    <form onSubmit={handleSignInSubmit} className="space-y-4">
      <div>
        <Label htmlFor="signin-nickname">Nickname</Label>
        <Input
          id="signin-nickname"
          value={signinNickname}
          onChange={(e) => setSigninNickname(e.target.value)}
          placeholder="Enter your nickname"
          required
          className="h-12"
        />
      </div>

      <div>
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          value={signinPassword}
          onChange={(e) => setSigninPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="h-12"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12"
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>

      {authState.nickname && (
        <button
          type="button"
          onClick={handleDifferentUser}
          className="w-full text-sm text-blue-600 hover:text-blue-700"
        >
          Different user?
        </button>
      )}
    </form>
  </div>
) : (
  // New User tab
)}
```

**Step 5: Test sign in flow**

Run: `npm run dev`
Test:
1. Switch to Sign In tab
2. Enter credentials → Should authenticate
3. If inactive → Redirects to profile
4. If active → Redirects to dashboard
5. "Different user?" link → Clears state and switches to New User tab

**Step 6: Commit sign in flow**

```bash
git add components/auth/password-gate.tsx
git commit -m "feat(auth): implement returning user sign in flow

- Login with nickname + personal password
- Pre-fills nickname if user logged in before
- Redirects to profile if inactive, dashboard if active
- Different user link clears auth state"
```

---

## Task 11: Add Profile to Bottom Navigation

**Files:**
- Modify: `app/dashboard/layout.tsx`

**Step 1: Find bottom navigation section**

Look for the nav element with bottom navigation items.

**Step 2: Add Profile nav item**

Add as the 4th item:

```typescript
import { User } from 'lucide-react';

// In the nav element, add:
<Link
  href="/profile"
  className={`flex flex-col items-center gap-1 touch-target ${
    pathname === '/profile'
      ? 'text-blue-600'
      : 'text-gray-600 hover:text-gray-900'
  }`}
>
  <User className="w-6 h-6" />
  <span className="text-xs">Profile</span>
</Link>
```

**Step 3: Test navigation**

Run: `npm run dev`
Navigate through app:
- Should see Profile button in bottom nav
- Click should navigate to /profile
- Active state should highlight when on profile page

**Step 4: Commit bottom nav update**

```bash
git add app/dashboard/layout.tsx
git commit -m "feat(nav): add Profile button to bottom navigation

- Fourth nav item with user icon
- Links to /profile page
- Active state when on profile"
```

---

## Task 12: Add Route Guards to Dashboard Pages

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/player-selection/page.tsx`
- Modify: `app/dashboard/ranking/page.tsx`

**Step 1: Add inactive user check to dashboard home**

In `app/dashboard/page.tsx`, add after auth check:

```typescript
import { useCurrentPlayer } from '@/hooks/use-current-player';

const { player, loading: playerLoading } = useCurrentPlayer();

useEffect(() => {
  if (!isAuthenticated()) {
    router.push('/');
    return;
  }

  // Redirect inactive users to profile
  if (!playerLoading && player && !player.isActive) {
    router.push('/profile');
  }
}, [router, playerLoading, player]);

if (playerLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}
```

**Step 2: Add same check to player-selection page**

Copy the same pattern to `app/dashboard/player-selection/page.tsx`.

**Step 3: Add same check to ranking page**

Copy the same pattern to `app/dashboard/ranking/page.tsx`.

**Step 4: Test route guards**

Run: `npm run dev`
Test:
1. Create inactive account → Should be forced to profile
2. Try navigating to dashboard → Should redirect back to profile
3. Complete profile → Should allow access to all pages

**Step 5: Commit route guards**

```bash
git add app/dashboard/page.tsx app/dashboard/player-selection/page.tsx app/dashboard/ranking/page.tsx
git commit -m "feat(auth): add route guards for inactive users

- Redirect inactive users to profile page
- Applied to dashboard, player-selection, and ranking pages
- Users must complete profile before accessing app"
```

---

## Task 13: Install Missing Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Check if lodash is installed**

Run: `npm list lodash`
If not installed, install it:

```bash
npm install lodash
npm install --save-dev @types/lodash
```

**Step 2: Run full type check**

Run: `npx tsc --noEmit`
Expected: Should compile without errors

**Step 3: Run tests if any exist**

Run: `npm test`
Expected: All existing tests should pass

**Step 4: Commit dependency updates**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add lodash for debounce utility

- Add lodash for nickname availability debouncing
- Add type definitions for TypeScript support"
```

---

## Task 14: Update Firestore Security Rules

**Files:**
- Modify: `firestore.rules`

**Step 1: Update players collection rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players collection
    match /players/{playerId} {
      // Anyone can read active players
      allow read: if resource.data.isActive == true;

      // Allow creation of inactive players (for self-registration)
      allow create: if request.resource.data.isActive == false;

      // Players can update their own document (profile completion)
      // Note: Since we don't use Firebase Auth, we can't verify identity
      // This is a known limitation - document in security notes
      allow update: if true;
    }

    // Config collection (read-only for clients)
    match /config/{document=**} {
      allow read: if true;
      allow write: if false;
    }

    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
    }

    // Matches collection
    match /matches/{matchId} {
      allow read: if true;
      allow create: if true;
      allow update: if true;
    }
  }
}
```

**Step 2: Deploy rules (or document for manual deployment)**

```bash
# If Firebase CLI is configured:
# firebase deploy --only firestore:rules

# Otherwise, document in commit message that rules need manual update
```

**Step 3: Commit security rules**

```bash
git add firestore.rules
git commit -m "feat(firestore): update security rules for self-registration

- Allow reading active players only
- Allow creating inactive players (self-registration)
- Allow updates (profile completion)
- Note: Limited security without Firebase Auth (documented limitation)"
```

---

## Task 15: Create Firestore Indexes

**Files:**
- Modify: `firestore.indexes.json`

**Step 1: Add required composite indexes**

```json
{
  "indexes": [
    {
      "collectionGroup": "players",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "nickname",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "players",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "players",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isActive",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "eloRating",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Step 2: Deploy indexes (or document for manual deployment)**

```bash
# If Firebase CLI is configured:
# firebase deploy --only firestore:indexes

# Otherwise, Firestore will prompt to create indexes when queries are first run
```

**Step 3: Commit index configuration**

```bash
git add firestore.indexes.json
git commit -m "feat(firestore): add indexes for player queries

- Index on nickname for login lookup
- Composite index on isActive + createdAt for cleanup
- Composite index on isActive + eloRating for leaderboard"
```

---

## Task 16: Update Environment Variables Example

**Files:**
- Modify: `.env.local.example`

**Step 1: Add note about config migration**

Add comment at the top:

```
# Firebase Configuration
# Note: After deploying this update, rename 'passwordHash' to 'sharedPasswordHash'
# in the Firestore 'config' document manually

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
...
```

**Step 2: Commit env example**

```bash
git add .env.local.example
git commit -m "docs(env): add migration note for config document

- Document manual step to rename passwordHash field
- Required for shared password authentication"
```

---

## Task 17: Manual Testing & Final Verification

**No files to modify - testing only**

**Step 1: Clear existing localStorage**

In browser console:
```javascript
localStorage.clear()
```

**Step 2: Test new user flow**

1. Navigate to http://localhost:3000
2. Should see login screen with tabs
3. Stay on "New User" tab
4. Enter office password → Continue
5. Fill registration: nickname, password, confirm
6. Submit → Should redirect to /profile
7. Should see "Complete Your Profile" message
8. Fill name and email
9. Click "Save & Activate"
10. Should redirect to /dashboard
11. Should see player in bottom nav area

**Step 3: Test logout and sign in**

1. Open browser console: `localStorage.clear()`
2. Refresh page
3. Switch to "Sign In" tab
4. Enter nickname and password from step 2
5. Submit → Should go to /dashboard (already active)

**Step 4: Test inactive user redirect**

1. Create another account but don't complete profile
2. Try navigating to /dashboard directly
3. Should redirect to /profile
4. Complete profile → Should allow access

**Step 5: Test nickname uniqueness**

1. Try creating account with existing nickname
2. Should show "This nickname is already taken"
3. Change nickname → Should allow creation

**Step 6: Test auto-cleanup (requires 24h wait or manual testing)**

Document test plan:
- Create inactive player
- Wait 24 hours (or modify cutoff time for testing)
- Create another player
- First player should be deleted

**Step 7: Document any issues found**

Create a testing-notes.md file if issues found.

---

## Task 18: Create Migration Script for Existing Data

**Files:**
- Create: `scripts/migrate-to-self-registration.js`

**Step 1: Create migration script**

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  // Use service account or default credentials
});

const db = admin.firestore();

async function migrateConfig() {
  console.log('Migrating config document...');

  const configSnapshot = await db.collection('config').get();

  if (configSnapshot.empty) {
    console.log('No config document found');
    return;
  }

  const configDoc = configSnapshot.docs[0];
  const data = configDoc.data();

  if (data.passwordHash && !data.sharedPasswordHash) {
    await configDoc.ref.update({
      sharedPasswordHash: data.passwordHash
    });
    console.log('✓ Renamed passwordHash to sharedPasswordHash');
  } else {
    console.log('✓ Config already migrated');
  }
}

async function migrateExistingPlayers() {
  console.log('Migrating existing players...');

  const playersSnapshot = await db.collection('players').get();

  let migratedCount = 0;

  for (const doc of playersSnapshot.docs) {
    const player = doc.data();

    // Skip if already migrated
    if (player.isActive !== undefined) {
      continue;
    }

    // Mark all existing players as active
    await doc.ref.update({
      isActive: true,
      nickname: player.nickname || null,
      passwordHash: player.passwordHash || null
    });

    migratedCount++;
  }

  console.log(`✓ Migrated ${migratedCount} players`);
}

async function main() {
  try {
    await migrateConfig();
    await migrateExistingPlayers();
    console.log('\n✅ Migration complete!');
    console.log('\nExisting players will need to:');
    console.log('1. Use "Sign In" tab on login screen');
    console.log('2. Create a nickname and password');
    console.log('3. Their existing profile data will be preserved');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit();
  }
}

main();
```

**Step 2: Add migration instructions to README**

Create `MIGRATION.md`:

```markdown
# Migration to Self-Registration System

## Pre-Deployment Steps

1. **Backup Firestore database** (recommended)
   - Go to Firebase Console → Firestore → Export

2. **Run migration script** (optional - for preserving existing players)
   ```bash
   node scripts/migrate-to-self-registration.js
   ```

3. **Deploy new code**
   ```bash
   npm run build
   firebase deploy
   ```

4. **Update Firestore rules and indexes**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Post-Deployment

Existing players will need to:
1. Use the "Sign In" tab
2. Create a nickname and password
3. Their existing stats and data will be preserved

OR

Option 2 (simpler):
1. Everyone re-registers as new users
2. Old player data can be archived/deleted
```

**Step 3: Commit migration script**

```bash
git add scripts/migrate-to-self-registration.js MIGRATION.md
git commit -m "chore(migration): add script for migrating to self-registration

- Script renames passwordHash to sharedPasswordHash in config
- Marks all existing players as active
- Adds migration instructions for deployment"
```

---

## Testing Checklist

Copy this checklist and verify each item:

- [ ] New user: Shared password → Registration → Profile completion
- [ ] Returning user: Direct sign in with nickname + password
- [ ] Inactive user forced to profile screen before dashboard access
- [ ] Profile save activates player (stays logged in)
- [ ] Profile edit for active user (stays logged in)
- [ ] Tab switching between New User and Sign In works
- [ ] Nickname uniqueness validation shows real-time errors
- [ ] "Different user?" link clears state and switches tabs
- [ ] Bottom nav Profile button appears and navigates correctly
- [ ] Active players visible in leaderboard
- [ ] Inactive players hidden from player selection
- [ ] localStorage persists across page reloads
- [ ] "Welcome back [nickname]" shows for returning users
- [ ] Route guards redirect inactive users to profile
- [ ] TypeScript compiles with no errors
- [ ] All existing tests still pass

---

## Recommended Execution Approach

This plan has 18 tasks with ~80 individual steps. Two execution options:

**Option 1: Subagent-Driven Development** (Recommended)
- Execute in this session
- Fresh subagent per task
- Code review between tasks
- Fast iteration with quality gates

**Option 2: Batch Execution**
- Execute all tasks in sequence
- Review at checkpoints (every 3-5 tasks)
- Faster but less oversight

Which approach would you prefer?
