# Player Self-Registration & Profile System Design

**Date:** 2025-10-31
**Status:** Design Complete - Ready for Implementation
**Context:** Replace admin-only player creation with self-service registration and profile management

---

## Overview

This design transforms the authentication and player creation system from admin-managed to self-service. Users will create their own accounts with unique nicknames and passwords, then complete their profile to activate and participate in matches.

## Goals

1. **Self-Service Registration:** Allow users to create accounts without admin intervention
2. **Profile Activation:** Require profile completion before participating in games
3. **Clean Database:** Auto-cleanup inactive accounts after 24 hours
4. **Better UX:** Remember returning users, streamline login experience
5. **Maintain Simplicity:** Minimal architecture changes, leverage existing systems

## Non-Goals

- Firebase Authentication migration (keeping client-side auth)
- Email verification or password reset features (Phase 1)
- Admin panel for user management (future enhancement)
- Rate limiting or advanced security (documented as limitation)

---

## Data Model Changes

### Player Document (Modified)

```typescript
interface Player {
  id: string;
  nickname: string;          // NEW - unique identifier for login
  passwordHash: string;       // NEW - bcrypt hash of personal password
  name: string | null;        // MODIFIED - nullable until profile complete
  email: string | null;       // MODIFIED - nullable until profile complete
  avatar: string;             // Auto-generated initials or uploaded
  eloRating: number;          // Default 1200
  stats: PlayerStats;         // Existing
  isActive: boolean;          // NEW - false until profile completed
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Key Changes:**
- `nickname` - Unique, case-insensitive, used for login (3-20 chars, alphanumeric + _-)
- `passwordHash` - Bcrypt hash (salt rounds = 10) of personal password
- `isActive` - Defaults to `false`, set to `true` when profile is completed
- `name` and `email` - Now nullable, required for activation

### AppConfig Document (Modified)

```typescript
interface AppConfig {
  sharedPasswordHash: string;  // RENAMED from passwordHash
  currentSessionDate: string;
  eloKFactor: number;
  defaultEloRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Change:** `passwordHash` → `sharedPasswordHash` (clearer naming)

### localStorage Auth State (Modified)

```typescript
// Old: { authenticated: boolean }
// New: { authenticated: boolean, playerId: string, nickname: string }
```

**Purpose:** Remember user identity across sessions for "Welcome back" UX

---

## Authentication Flow

### Login Screen Layout

**Always shows two tabs:** "New User" | "Sign In"

- If localStorage has `playerId` → Auto-select "Sign In" tab, pre-fill nickname
- Users can switch tabs at any time
- Clean, simple toggle/tab UI

### Tab 1: "New User" Flow

**Step 1: Shared Password Entry**
- Header: "Welcome to Office Ping Pong 🏓"
- Input: Shared password (with show/hide toggle)
- Button: "Continue"
- Validates against `appConfig.sharedPasswordHash`

**Step 2: Create Account**
- Header: "Create Your Account"
- Inputs:
  - Nickname (real-time uniqueness check, debounced 500ms)
  - Create password (min 8 chars, show/hide toggle)
  - Confirm password
- Button: "Create Account"
- Actions:
  1. Run `cleanupInactivePlayers()` (delete inactive > 24h)
  2. Create player document with `isActive: false`
  3. Save to localStorage: `{ authenticated: true, playerId, nickname }`
  4. Redirect to `/profile`

### Tab 2: "Sign In" Flow

**Returning User Login (Single Step)**
- Header: "Welcome Back 👋"
- Inputs:
  - Nickname (pre-filled if localStorage exists)
  - Password (show/hide toggle)
- Button: "Sign In"
- Actions:
  1. Query Firestore for player with matching nickname
  2. Verify passwordHash with bcrypt
  3. Save to localStorage: `{ authenticated: true, playerId, nickname }`
  4. If `isActive === false` → Redirect to `/profile`
  5. If `isActive === true` → Redirect to `/dashboard`

### Profile Completion Screen

**URL:** `/profile` (separate page, always accessible)

**For Inactive Users (First Time):**
- Cannot navigate away until profile complete
- Pre-filled: Nickname (disabled/read-only)
- Required: Full Name*, Email*
- Optional: Avatar upload (max 5MB, JPG/PNG/WebP)
- Button: "Save & Activate"
- Actions:
  1. Update player: name, email, avatar, `isActive = true`
  2. **Stay logged in** (no logout)
  3. Redirect to `/dashboard`

**For Active Users (Editing):**
- Accessible from bottom nav "Profile" button
- All fields editable except nickname (disabled)
- Button: "Save Changes"
- Actions:
  1. Update player document
  2. **Stay logged in** (no logout)
  3. Show success message, stay on page or return to previous

**Key Principle:** Profile saves NEVER log the user out

---

## Database Operations

### New Firebase Functions

**lib/firebase/auth.ts (modified):**

```typescript
// Verify shared office password
async function verifySharedPassword(password: string): Promise<boolean>

// Create inactive player with nickname + password
async function createInactivePlayer(
  nickname: string,
  password: string
): Promise<Player>

// Authenticate player by nickname + password
async function authenticatePlayer(
  nickname: string,
  password: string
): Promise<Player | null>

// Check if nickname is available (real-time)
async function checkNicknameAvailable(nickname: string): Promise<boolean>
```

**lib/firebase/players.ts (modified):**

```typescript
// Update profile and activate player
async function updatePlayerProfile(
  playerId: string,
  data: { name: string, email: string, avatar?: string }
): Promise<void>

// Delete inactive players older than 24 hours
async function cleanupInactivePlayers(): Promise<number>
```

### Firestore Queries

**Check nickname uniqueness:**
```typescript
const q = query(
  collection(db, 'players'),
  where('nickname', '==', nickname.toLowerCase())
);
```

**Authenticate by nickname:**
```typescript
const q = query(
  collection(db, 'players'),
  where('nickname', '==', nickname.toLowerCase()),
  limit(1)
);
```

**Cleanup inactive players:**
```typescript
const cutoff = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
const q = query(
  collection(db, 'players'),
  where('isActive', '==', false),
  where('createdAt', '<', cutoff)
);
// Delete all matching documents
```

### Firestore Indexes Required

- `players` collection: `nickname` (ASC)
- `players` collection: `isActive` (ASC) + `createdAt` (ASC)

### Auto-Cleanup Trigger

```typescript
// Called in createInactivePlayer() BEFORE creating new player
await cleanupInactivePlayers();
// Then proceed with player creation
```

---

## UI Components

### Files to Create

**components/profile/profile-form.tsx** (NEW)
- Based on visual design spec in `docs/design_specs/stitch_player_selection_screen/player_creation_screen/`
- Form fields: Nickname (disabled), Full Name*, Email*, Avatar
- Avatar upload with preview
- Client-side validation
- Loading states, error handling

**app/profile/page.tsx** (NEW)
- Profile screen page component
- Route guard: redirects to `/` if not authenticated
- Shows ProfileForm component
- For inactive users: blocks navigation (modal-like behavior)
- For active users: normal navigation allowed

**hooks/use-current-player.ts** (NEW)
- Hook to get current logged-in player data
- Reads `playerId` from localStorage
- Subscribes to real-time Firestore updates
- Returns player object and loading state

### Files to Modify

**components/auth/password-gate.tsx** (MAJOR REFACTOR)
- Add tab/toggle UI: "New User" | "Sign In"
- Implement two-step new user flow
- Implement one-step sign in flow
- localStorage detection for returning users
- Real-time nickname availability checking
- Error states for all forms

**hooks/use-players.ts** (MINOR CHANGE)
- Add filter: `where('isActive', '==', true)`
- Only return active players in queries

**app/dashboard/layout.tsx** (MINOR CHANGE)
- Add 4th bottom nav item: "Profile" with user icon
- Route: `/profile`
- Always visible for active users

### Routing & Navigation Guards

**Middleware/guards needed:**
```typescript
// Pseudo-code for route protection
if (!authenticated) → redirect to /
if (authenticated && !isActive && route !== '/profile') → redirect to /profile
if (authenticated && isActive) → allow all routes
```

**Implementation:** Add checks to page-level `useEffect` hooks in each protected route

---

## Validation Rules

### Registration Form

**Nickname:**
- 3-20 characters
- Alphanumeric + underscore/hyphen only
- Case-insensitive uniqueness (store lowercase, display as entered)
- Real-time validation (debounced 500ms)
- Error: "This nickname is already taken"

**Password:**
- Minimum 8 characters
- At least one letter and one number (basic strength)
- Show/hide toggle for UX
- Error: "Password must be at least 8 characters with letters and numbers"

**Confirm Password:**
- Must match password field
- Error: "Passwords do not match"

### Profile Form

**Full Name:**
- 2-50 characters
- Required for activation
- Error: "Please enter your full name"

**Email:**
- Valid email format (HTML5 validation)
- Required for activation
- Error: "Please enter a valid email address"

**Avatar:**
- Optional
- Max 5MB file size
- Formats: JPG, PNG, WebP
- Error: "File too large. Maximum 5MB."

---

## Error Handling

### Error Messages

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Shared password wrong | "Invalid password. Please try again." | Clear input, stay on form |
| Nickname taken | "This nickname is already taken" | Show below field in real-time |
| Passwords don't match | "Passwords do not match" | Show below confirm field |
| Login failed | "Invalid nickname or password" | Clear password, stay on form |
| Network error | "Connection error. Please check your internet." | Toast notification |
| Profile save failed | "Failed to save profile. Please try again." | Keep form data |
| Avatar upload failed | "Failed to upload image. Try a smaller file." | Keep other fields |

### Edge Cases

**1. User closes browser during registration**
- Player document created but profile incomplete
- Next login: Authenticate → Redirected to profile screen
- Auto-cleanup removes if not completed within 24 hours

**2. Nickname collision during submission**
- Final uniqueness check in `createInactivePlayer()`
- If taken: Error "Someone just took this nickname. Please choose another."

**3. Multiple tabs/devices**
- localStorage only affects that tab/device
- Each independently checks authentication on load
- Firestore is source of truth for player state

**4. User tries to access app while inactive**
- All page guards check `isActive` status
- Force redirect to `/profile` with message

**5. Lost localStorage (cleared data, new device)**
- User can access account via "Sign In" tab
- Tab toggle always visible for this scenario

---

## Migration Strategy

### Existing Data

**Current state:**
- Single `passwordHash` in appConfig
- Players without `nickname`, `passwordHash`, `isActive` fields
- All players implicitly active

### Migration Approach: Hard Cutover (Recommended)

**Steps:**
1. Deploy new system with updated schema
2. Rename `appConfig.passwordHash` → `appConfig.sharedPasswordHash`
3. Existing players must re-register with nickname + password
4. Old player data can remain (won't match new queries)

**Rationale:** Office context allows brief setup period, simpler than gradual migration

**Alternative: Gradual Migration** (if needed)
- Add "Claim your account" flow for existing players
- Show banner: "Add a nickname to continue"
- Map existing players to new schema

---

## Security Considerations

### Password Storage
- Bcrypt with salt rounds = 10 (same as current)
- Store `passwordHash` in player document
- Never log or expose plain passwords

### Nickname Uniqueness
- Case-insensitive (store lowercase)
- Enforce at application layer
- Double-check in transaction before creation

### Input Sanitization
- Validate all user inputs server-side
- React auto-escapes (rely on default behavior)
- Avatar URLs: only allow uploaded images or data URIs

### Known Limitations (Phase 1)
- No Firebase Authentication (client-side auth only)
- No rate limiting (document as limitation)
- No password reset flow (admin must manually update)
- No email verification
- Security relies on shared password obscurity

### Future Enhancements
- Firebase Authentication migration
- Email-based password reset
- Rate limiting with Firebase App Check
- Admin panel for user management

---

## Testing Checklist

**Manual Testing:**
- [ ] New user: Shared password → Registration → Profile completion
- [ ] Returning user: Direct login with nickname + password
- [ ] Inactive user forced to profile screen
- [ ] Profile save activates player (stays logged in)
- [ ] Profile edit for active user (stays logged in)
- [ ] Tab switching between New User and Sign In
- [ ] Nickname uniqueness validation in real-time
- [ ] Auto-cleanup runs on new player creation
- [ ] Bottom nav Profile button appears
- [ ] Inactive players hidden from player lists
- [ ] localStorage persistence across reloads
- [ ] "Welcome back [nickname]" shows for returning users
- [ ] Lost localStorage: Can still sign in via tab

**Error Testing:**
- [ ] Wrong shared password
- [ ] Nickname already taken
- [ ] Passwords don't match
- [ ] Invalid login credentials
- [ ] Network disconnected during save
- [ ] Invalid email format
- [ ] Avatar file too large

---

## Implementation Notes

### Visual Design Reference
- Design spec: `docs/design_specs/stitch_player_selection_screen/player_creation_screen/`
- Use existing Shadcn UI components: Input, Button, Dialog, Label
- Match existing color scheme: primary = #137fec
- Mobile-first responsive design

### Architecture Principles
- **Minimal approach:** Store passwords in player documents (no separate users collection)
- **Client-side auth:** Continue using localStorage + bcrypt (no Firebase Auth)
- **Auto-cleanup:** Runs on every new player creation (simple trigger)
- **Real-time validation:** Use Firestore queries for nickname uniqueness
- **Progressive enhancement:** Tab system works without localStorage detection

### Development Order (Suggested)
1. Update data model (add fields to Player interface)
2. Create/modify Firebase functions (auth.ts, players.ts)
3. Refactor password-gate.tsx (tab system + forms)
4. Create profile-form.tsx and profile page
5. Add route guards to protected pages
6. Update use-players hook (filter active only)
7. Add Profile button to bottom nav
8. Test all flows manually
9. Deploy and migrate existing data

---

## Success Metrics

**Immediate (Phase 1):**
- Users can self-register without admin help
- Profile completion rate > 80% within 24 hours
- Zero manual player creation needed
- Login experience is smooth for returning users

**Future (Post-Phase 1):**
- Average registration time < 2 minutes
- Profile edit usage tracking
- Inactive account cleanup effectiveness
- User feedback on registration flow

---

## Summary

This design replaces admin-managed player creation with a self-service system featuring:

1. **Two-path login:** New users (shared password → registration) vs. Returning users (nickname + password)
2. **Profile activation:** Users complete profile (name, email, avatar) to participate
3. **Auto-cleanup:** Inactive accounts deleted after 24 hours
4. **Remember me:** localStorage enables "Welcome back" UX
5. **Minimal architecture:** Extends existing system without major refactoring

The system maintains simplicity while enabling self-service onboarding and better user management.
