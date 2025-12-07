# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate dashboard and today's matches into one screen with player avatar filters.

**Architecture:** Add `PlayerAvatarFilter` component for multi-select filtering (max 2). Refactor dashboard page to embed matches directly, reusing existing `SwipeablePendingMatch` and match card components. Filter state managed locally.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, existing hooks (`useEnrichedMatches`, `usePlayersByIds`, `useCurrentSession`)

---

## Task 1: Create PlayerAvatarFilter Component

**Files:**
- Create: `components/filters/player-avatar-filter.tsx`

**Step 1: Create the component file**

```tsx
'use client';

import { Player } from '@/types';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { cn } from '@/lib/utils';

interface PlayerAvatarFilterProps {
  players: Player[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
}

export function PlayerAvatarFilter({
  players,
  selectedIds,
  onSelectionChange,
  maxSelections = 2,
}: PlayerAvatarFilterProps) {
  const handleToggle = (playerId: string) => {
    if (selectedIds.includes(playerId)) {
      // Deselect
      onSelectionChange(selectedIds.filter(id => id !== playerId));
    } else if (selectedIds.length < maxSelections) {
      // Select (if under max)
      onSelectionChange([...selectedIds, playerId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {players.map(player => {
        const isSelected = selectedIds.includes(player.id);
        return (
          <button
            key={player.id}
            onClick={() => handleToggle(player.id)}
            className={cn(
              'rounded-full transition-all',
              isSelected
                ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
                : 'ring-1 ring-gray-200 hover:ring-gray-300'
            )}
            aria-label={`Filter by ${player.name}`}
            aria-pressed={isSelected}
          >
            <PlayerAvatar
              avatar={player.avatar}
              name={player.name || player.nickname}
              size="sm"
            />
          </button>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify file created**

Run: `cat components/filters/player-avatar-filter.tsx | head -5`
Expected: Shows the 'use client' and imports

**Step 3: Commit**

```bash
git add components/filters/player-avatar-filter.tsx
git commit -m "feat: add PlayerAvatarFilter component for match filtering"
```

---

## Task 2: Refactor Dashboard - Add Imports and State

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Update imports**

Replace lines 1-15 with:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useCurrentSession } from '@/hooks/use-session';
import { useEnrichedMatches } from '@/hooks/use-enriched-matches';
import { usePlayersByIds } from '@/hooks/use-players-by-ids';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { PlayerAvatarFilter } from '@/components/filters/player-avatar-filter';
import { SwipeablePendingMatch } from '@/components/matches/swipeable-pending-match';
import { MatchResultModal } from '@/components/matches/match-result-modal';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { recordMatchResult, deletePendingMatch } from '@/lib/firebase/matches';
import { Match } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
```

**Step 2: Verify imports compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to imports (or no output)

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "refactor: update dashboard imports for inline matches"
```

---

## Task 3: Add Hooks and State to Dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Update component state**

Inside `DashboardPage` function, after line `const [calendarOpen, setCalendarOpen] = useState(false);`, add:

```tsx
  const { matches, loading: matchesLoading } = useEnrichedMatches();
  const { players: sessionPlayers, loading: playersLoading } = usePlayersByIds(
    session?.players || []
  );
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
```

**Step 2: Add handler functions**

After the `useEffect` block, add:

```tsx
  const handleRecordResult = (match: Match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  const handleSubmitResult = async (
    matchId: string,
    player1Score: number,
    player2Score: number
  ) => {
    const sessionDate = format(new Date(), 'yyyy-MM-dd');
    const winnerId = player1Score > player2Score
      ? selectedMatch?.player1.id
      : selectedMatch?.player2.id;

    if (!winnerId) {
      throw new Error('Could not determine winner');
    }

    await recordMatchResult(sessionDate, matchId, {
      player1Score,
      player2Score,
      winnerId,
    });
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const sessionDate = format(new Date(), 'yyyy-MM-dd');
      await deletePendingMatch(sessionDate, matchId);
      toast.success('Match deleted');
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
    }
  };
```

**Step 3: Update loading check**

Change the loading condition from:
```tsx
  if (playerLoading || sessionLoading) {
```
to:
```tsx
  if (playerLoading || sessionLoading || matchesLoading || playersLoading) {
```

**Step 4: Verify compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add match hooks and handlers to dashboard"
```

---

## Task 4: Add Filter Logic and Derived State

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Add derived state calculations**

After the handler functions, before `return`, add:

```tsx
  // Derive filtered matches and player list
  const playersArray = Array.from(sessionPlayers.values());
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const completedMatches = matches.filter(m => m.status === 'completed');

  // Filter pending matches based on selected players
  const filteredPendingMatches = pendingMatches.filter(match => {
    if (selectedPlayerIds.length === 0) return true;
    if (selectedPlayerIds.length === 1) {
      return match.player1.id === selectedPlayerIds[0] ||
             match.player2.id === selectedPlayerIds[0];
    }
    // 2 players selected: exact combination
    const matchPlayerIds = [match.player1.id, match.player2.id];
    return selectedPlayerIds.every(id => matchPlayerIds.includes(id));
  });

  // For empty state messages
  const hasActiveFilter = selectedPlayerIds.length > 0;
  const getFilteredPlayerNames = () => {
    return selectedPlayerIds
      .map(id => sessionPlayers.get(id)?.name || sessionPlayers.get(id)?.nickname || 'Unknown')
      .join(' & ');
  };
```

**Step 2: Verify compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add filter logic for pending matches"
```

---

## Task 5: Rewrite Session Active UI

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Replace the session active JSX**

Replace the entire `{/* Session Active State */}` block (lines 85-146 approximately, the `<div>` after `: (`) with:

```tsx
          // Session Active State
          <div className="flex flex-col gap-4">
            {/* Add More Matches Button */}
            <Link href="/dashboard/add-matches" className="w-full">
              <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold">
                + Add More Matches
              </Button>
            </Link>

            {/* Completion Bar */}
            <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex gap-6 justify-between items-center">
                  <p className="text-slate-900 text-base font-medium">Completion</p>
                  <p className="text-slate-600 text-sm">
                    {session.completedMatches}/{session.totalMatches}
                  </p>
                </div>
                <div className="w-full rounded-full bg-slate-200 h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Player Filter */}
            {playersArray.length > 0 && (
              <div className="py-2">
                <PlayerAvatarFilter
                  players={playersArray}
                  selectedIds={selectedPlayerIds}
                  onSelectionChange={setSelectedPlayerIds}
                />
              </div>
            )}

            {/* Filter Active Indicator */}
            {hasActiveFilter && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                Filtering by: {getFilteredPlayerNames()}
              </div>
            )}

            {/* Pending Matches Section */}
            {filteredPendingMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-bold pb-3 pt-2">
                  Pending ({filteredPendingMatches.length})
                </h2>
                <p className="text-sm text-slate-500 pb-3">
                  Swipe left to delete a match
                </p>
                {filteredPendingMatches.map(match => (
                  <SwipeablePendingMatch
                    key={match.id}
                    match={match}
                    onRecordResult={handleRecordResult}
                    onDelete={handleDeleteMatch}
                  />
                ))}
              </div>
            )}

            {/* Empty State: Filter with no results */}
            {hasActiveFilter && filteredPendingMatches.length === 0 && pendingMatches.length > 0 && (
              <div className="py-8 text-center">
                <span className="text-4xl">🔍</span>
                <p className="mt-2 text-slate-600">
                  No pending matches for {getFilteredPlayerNames()}
                </p>
              </div>
            )}

            {/* Empty State: All completed */}
            {!hasActiveFilter && pendingMatches.length === 0 && completedMatches.length > 0 && (
              <div className="py-8 text-center">
                <span className="text-4xl">🎉</span>
                <h3 className="mt-2 text-lg font-semibold">All done for today!</h3>
              </div>
            )}

            {/* Completed Matches Section */}
            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-bold pb-3 pt-2">
                  Completed ({completedMatches.length})
                </h2>
                {completedMatches.map(match => {
                  const player1Won = match.winnerId === match.player1.id;
                  const player2Won = match.winnerId === match.player2.id;

                  return (
                    <Card
                      key={match.id}
                      className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm mb-4 border border-green-500/50"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Player 1 */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              avatar={match.player1.avatar}
                              name={match.player1.name}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player1Won ? 'text-green-600' : ''}`}>
                                {match.player1.name}
                              </p>
                              <p className="text-sm text-slate-600">
                                Score: {match.player1.score}
                              </p>
                            </div>
                          </div>
                          {match.player1.eloChange !== null && (
                            <div className={`flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                              match.player1.eloChange >= 0
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              {match.player1.eloChange >= 0 ? '+' : ''}{match.player1.eloChange}
                            </div>
                          )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              avatar={match.player2.avatar}
                              name={match.player2.name}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player2Won ? 'text-green-600' : ''}`}>
                                {match.player2.name}
                              </p>
                              <p className="text-sm text-slate-600">
                                Score: {match.player2.score}
                              </p>
                            </div>
                          </div>
                          {match.player2.eloChange !== null && (
                            <div className={`flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                              match.player2.eloChange >= 0
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              {match.player2.eloChange >= 0 ? '+' : ''}{match.player2.eloChange}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
```

**Step 2: Verify compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: inline matches display with filter in dashboard"
```

---

## Task 6: Add Match Result Modal

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Add modal before closing tags**

Before the final `</div>` (before `{/* Bottom Navigation */}`), add:

```tsx
      {/* Match Result Modal */}
      <MatchResultModal
        match={selectedMatch}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitResult}
      />
```

**Step 2: Verify compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add match result modal to dashboard"
```

---

## Task 7: Final Verification

**Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (or only warnings)

**Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Manual test**

Run: `npm run dev`
Test:
1. Open dashboard - should show "Ready to Play" if no session
2. Create session - should show matches inline with filter avatars
3. Click avatar to filter - pending matches filter
4. Click two avatars - filters to exact combination
5. Click avatar again to deselect - returns to full list
6. Record a result - modal opens, submit works
7. Swipe to delete - works

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete dashboard redesign with inline matches and player filters"
```
