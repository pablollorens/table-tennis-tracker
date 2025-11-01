# Session Calendar and History View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a calendar date selector that allows users to navigate between different session dates and view historical match data in a read-only format.

**Architecture:** Calendar modal slides down from top showing month view with highlighted dates that have sessions. Clicking a date navigates to a history page. Data is loaded month-by-month from Firestore with client-side caching. Existing hooks are extended to accept optional date parameters.

**Tech Stack:** Next.js 14, React, TypeScript, Firestore, date-fns, shadcn/ui Dialog, Tailwind CSS

---

## Task 1: Create Firestore query function for sessions by month

**Files:**
- Modify: `lib/firebase/sessions.ts`
- Test: Manual testing in browser console

**Step 1: Add getSessionsByMonth function**

Add this function to `lib/firebase/sessions.ts`:

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Get all session dates that have matches for a given month
 */
export async function getSessionsByMonth(yearMonth: string): Promise<string[]> {
  // yearMonth format: "2025-10"
  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-31`;

  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    where('totalMatches', '>', 0)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().date as string);
}
```

**Step 2: Test in browser console**

1. Run `npm run dev`
2. Open browser console
3. Import and test: Check that function returns array of date strings for the current month

**Step 3: Commit**

```bash
git add lib/firebase/sessions.ts
git commit -m "feat: add getSessionsByMonth query function"
```

---

## Task 2: Create useSessionCalendar hook

**Files:**
- Create: `hooks/use-session-calendar.ts`

**Step 1: Create the hook with caching**

```typescript
import { useState, useEffect } from 'react';
import { getSessionsByMonth } from '@/lib/firebase/sessions';

interface UseSessionCalendarResult {
  sessionDates: string[];
  loading: boolean;
  error: Error | null;
  loadMonth: (yearMonth: string) => Promise<void>;
}

export function useSessionCalendar(initialMonth: string): UseSessionCalendarResult {
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cache, setCache] = useState<Map<string, string[]>>(new Map());
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const loadMonth = async (yearMonth: string) => {
    // Check cache first
    if (cache.has(yearMonth)) {
      setSessionDates(cache.get(yearMonth)!);
      setCurrentMonth(yearMonth);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dates = await getSessionsByMonth(yearMonth);

      // Update cache
      setCache(prev => new Map(prev).set(yearMonth, dates));
      setSessionDates(dates);
      setCurrentMonth(yearMonth);
    } catch (err) {
      console.error('Error fetching session dates:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonth(initialMonth);
  }, []); // Only load initial month once

  return { sessionDates, loading, error, loadMonth };
}
```

**Step 2: Commit**

```bash
git add hooks/use-session-calendar.ts
git commit -m "feat: add useSessionCalendar hook with month caching"
```

---

## Task 3: Update existing hooks to accept optional date parameter

**Files:**
- Modify: `hooks/use-session.ts`
- Modify: `hooks/use-matches.ts`

**Step 1: Modify useCurrentSession to accept date parameter**

In `hooks/use-session.ts`, change the function signature and implementation:

```typescript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Session } from '@/types';
import { format } from 'date-fns';

export function useCurrentSession(date?: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const sessionDate = date || format(new Date(), 'yyyy-MM-dd');
    const sessionRef = doc(db, 'sessions', sessionDate);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession({ date: sessionDate, ...snapshot.data() } as Session);
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
  }, [date]);

  return { session, loading, error };
}
```

**Step 2: Modify useTodayMatches to accept date parameter**

In `hooks/use-matches.ts`, change the function signature and implementation:

```typescript
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Match } from '@/types';
import { format } from 'date-fns';

export function useTodayMatches(date?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const sessionDate = date || format(new Date(), 'yyyy-MM-dd');
    const matchesRef = collection(db, `sessions/${sessionDate}/matches`);
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
  }, [date]);

  return { matches, loading, error };
}
```

**Step 3: Commit**

```bash
git add hooks/use-session.ts hooks/use-matches.ts
git commit -m "feat: add optional date parameter to session and matches hooks"
```

---

## Task 4: Create DateSelector component

**Files:**
- Create: `components/calendar/date-selector.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';

interface DateSelectorProps {
  date?: Date;
  onClick: () => void;
}

export function DateSelector({ date, onClick }: DateSelectorProps) {
  const isToday = date
    ? format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    : true;

  const displayText = isToday
    ? 'Today'
    : format(date || new Date(), 'MMMM d, yyyy');

  return (
    <button
      onClick={onClick}
      className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-slate-100 dark:bg-slate-800 pl-4 pr-2 active:bg-slate-200 dark:active:bg-slate-700"
      aria-label="Select date"
    >
      <CalendarDays className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      <p className="text-slate-900 dark:text-slate-100 text-sm font-medium leading-normal">
        {displayText}
      </p>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/date-selector.tsx
git commit -m "feat: add DateSelector component"
```

---

## Task 5: Create SessionCalendarModal component (Part 1: Structure)

**Files:**
- Create: `components/calendar/session-calendar-modal.tsx`

**Step 1: Create modal structure with Dialog**

```typescript
'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSessionCalendar } from '@/hooks/use-session-calendar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface SessionCalendarModalProps {
  open: boolean;
  onClose: () => void;
  currentDate?: Date;
}

export function SessionCalendarModal({ open, onClose, currentDate = new Date() }: SessionCalendarModalProps) {
  const [viewDate, setViewDate] = useState(currentDate);
  const router = useRouter();
  const { toast } = useToast();

  const yearMonth = format(viewDate, 'yyyy-MM');
  const { sessionDates, loading } = useSessionCalendar(yearMonth);

  const handlePrevMonth = () => {
    const newDate = subMonths(viewDate, 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(viewDate, 1);
    setViewDate(newDate);
  };

  const handleToday = () => {
    router.push('/dashboard');
    onClose();
  };

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const hasSession = sessionDates.includes(dateString);

    if (hasSession) {
      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (isToday) {
        router.push('/dashboard');
      } else {
        router.push(`/dashboard/history/${dateString}`);
      }
      onClose();
    } else {
      toast({
        description: 'No session on this date',
        duration: 2000,
      });
    }
  };

  // Calculate calendar grid
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="top-0 translate-y-0 rounded-b-xl rounded-t-none max-w-md h-[70vh] p-0 gap-0"
        aria-labelledby="calendar-heading"
      >
        {/* Content will be added in next steps */}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/session-calendar-modal.tsx
git commit -m "feat: add SessionCalendarModal component structure"
```

---

## Task 6: Create SessionCalendarModal component (Part 2: Calendar UI)

**Files:**
- Modify: `components/calendar/session-calendar-modal.tsx`

**Step 1: Add calendar UI inside DialogContent**

Replace the `{/* Content will be added in next steps */}` comment with:

```typescript
        <div className="flex flex-col h-full">
          {/* Month Navigation */}
          <div className="flex items-center p-2 justify-between">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="flex size-12 items-center justify-center text-[#007AFF] hover:bg-slate-100 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2
              id="calendar-heading"
              className="text-[#333333] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center"
            >
              {format(viewDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="flex size-12 items-center justify-center text-[#007AFF] hover:bg-slate-100 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex flex-col items-center justify-start pt-4">
              <div className="grid grid-cols-7 w-full max-w-sm">
                {/* Day Headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <p
                    key={i}
                    aria-hidden="true"
                    className="text-[#8E8E93] dark:text-gray-400 text-xs font-bold leading-normal flex h-10 w-full items-center justify-center"
                  >
                    {day}
                  </p>
                ))}

                {/* Date Cells */}
                {calendarDays.map((day, i) => {
                  const dateString = format(day, 'yyyy-MM-dd');
                  const hasSession = sessionDates.includes(dateString);
                  const isToday = dateString === todayString;
                  const isSelected = isSameDay(day, currentDate);
                  const isCurrentMonth = isSameMonth(day, viewDate);

                  return (
                    <button
                      key={i}
                      onClick={() => isCurrentMonth && handleDateClick(day)}
                      disabled={!isCurrentMonth}
                      aria-label={`${format(day, 'MMMM d, yyyy')}${hasSession ? ', has sessions' : ''}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}`}
                      className={`h-12 w-full text-sm font-medium leading-normal relative ${
                        !isCurrentMonth
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-[#333333] dark:text-white'
                      }`}
                    >
                      <div
                        className={`flex size-full items-center justify-center rounded-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                            ? 'border-2 border-[#007AFF] text-[#007AFF]'
                            : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                      {hasSession && !isSelected && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-[#007AFF]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today Button */}
          <div className="p-4 w-full">
            <Button
              onClick={handleToday}
              className="w-full h-12 bg-[#007AFF] hover:bg-blue-600 text-white text-base font-bold"
            >
              Today
            </Button>
          </div>
        </div>
```

**Step 2: Commit**

```bash
git add components/calendar/session-calendar-modal.tsx
git commit -m "feat: add calendar grid UI to SessionCalendarModal"
```

---

## Task 7: Update dashboard page with DateSelector

**Files:**
- Modify: `app/dashboard/page.tsx`

**Step 1: Import components and add state**

Add these imports at the top:

```typescript
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { useState } from 'react';
```

Add state inside the component:

```typescript
const [calendarOpen, setCalendarOpen] = useState(false);
```

**Step 2: Replace the date display in header**

Find this section in the header (around line 48-54):

```typescript
<div className="flex items-center gap-2">
  <CalendarDays className="w-5 h-5 text-slate-500" />
  <p className="text-slate-600 text-sm font-medium">{today}</p>
</div>
```

Replace with:

```typescript
<DateSelector onClick={() => setCalendarOpen(true)} />
```

**Step 3: Add calendar modal before closing div**

Add before the final `</div>`:

```typescript
      {/* Calendar Modal */}
      <SessionCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
```

**Step 4: Remove unused import**

Remove the `CalendarDays` import since it's now used in DateSelector:

```typescript
// Remove this line:
import { CalendarDays } from 'lucide-react';
```

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: integrate DateSelector and calendar modal in dashboard"
```

---

## Task 8: Update today matches page with DateSelector

**Files:**
- Modify: `app/dashboard/today/page.tsx`

**Step 1: Import components and add state**

Add imports:

```typescript
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { useState } from 'react';
```

Add state:

```typescript
const [calendarOpen, setCalendarOpen] = useState(false);
```

**Step 2: Replace date display in header**

Find the header section (around line 76-90) and replace the date/emoji display with:

```typescript
<div className="max-w-2xl mx-auto flex items-center gap-3 p-4 pb-2">
  <button
    onClick={() => router.back()}
    className="touch-target p-2 hover:bg-gray-100 rounded-lg"
  >
    <ArrowLeft className="w-6 h-6" />
  </button>
  <h1 className="text-xl font-bold leading-tight tracking-tight flex-1">
    Today&apos;s Matches
  </h1>
  <DateSelector onClick={() => setCalendarOpen(true)} />
</div>
```

**Step 3: Add calendar modal**

Add before the final `</div>`:

```typescript
      {/* Calendar Modal */}
      <SessionCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
```

**Step 4: Commit**

```bash
git add app/dashboard/today/page.tsx
git commit -m "feat: add DateSelector to today matches page"
```

---

## Task 9: Create history page

**Files:**
- Create: `app/dashboard/history/[date]/page.tsx`

**Step 1: Create the history page**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useCurrentSession } from '@/hooks/use-session';
import { useTodayMatches } from '@/hooks/use-matches';
import { Card } from '@/components/ui/card';
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { format, parse, isValid } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;
  const { player, loading: playerLoading } = useCurrentPlayer();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [parsedDate, setParsedDate] = useState<Date | null>(null);

  // Validate and parse date parameter
  useEffect(() => {
    if (!dateParam) {
      router.push('/dashboard');
      return;
    }

    try {
      const date = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (!isValid(date)) {
        router.push('/dashboard');
        return;
      }
      setParsedDate(date);
    } catch {
      router.push('/dashboard');
    }
  }, [dateParam, router]);

  const { session, loading: sessionLoading } = useCurrentSession(dateParam);
  const { matches, loading: matchesLoading } = useTodayMatches(dateParam);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    if (!playerLoading && player && !player.isActive) {
      router.push('/profile');
    }
  }, [router, playerLoading, player]);

  if (playerLoading || sessionLoading || matchesLoading || !parsedDate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const completedMatches = matches.filter(m => m.status === 'completed');
  const pendingMatches = matches.filter(m => m.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto flex items-center p-4 pb-2 justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Back to dashboard"
            className="text-slate-800 dark:text-slate-200 flex size-12 shrink-0 items-center justify-start hover:bg-slate-100 rounded-lg p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {format(parsedDate, 'MMMM d, yyyy')}
          </h2>
          <DateSelector date={parsedDate} onClick={() => setCalendarOpen(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {!session ? (
          // No Session State
          <div className="flex flex-col items-center justify-center text-center p-8 mt-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-5xl mb-4">📅</span>
            <h4 className="text-slate-800 dark:text-slate-200 text-lg font-semibold">
              No Matches Scheduled
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              No matches were played on this day.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-300 text-base font-medium leading-normal">
                  Total Matches
                </p>
                <p className="text-slate-900 dark:text-slate-50 tracking-light text-2xl font-bold leading-tight">
                  {session.totalMatches}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-300 text-base font-medium leading-normal">
                  Completed
                </p>
                <p className="text-slate-900 dark:text-slate-50 tracking-light text-2xl font-bold leading-tight">
                  {session.completedMatches}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-300 text-base font-medium leading-normal">
                  Pending
                </p>
                <p className="text-slate-900 dark:text-slate-50 tracking-light text-2xl font-bold leading-tight">
                  {session.pendingMatches}
                </p>
              </div>
            </div>

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] px-0 pb-2 pt-4">
                  Completed
                </h3>
                <div className="flex flex-col gap-2">
                  {completedMatches.map(match => {
                    const player1Won = match.winnerId === match.player1.id;
                    const player2Won = match.winnerId === match.player2.id;

                    return (
                      <Card
                        key={match.id}
                        className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                      >
                        {/* Player 1 */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              {match.player1.name?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player1Won ? 'text-green-600' : ''}`}>
                                {match.player1.name}
                              </p>
                              <p className="text-sm font-normal leading-normal text-slate-600">
                                Score: {match.player1.score}
                              </p>
                            </div>
                          </div>
                          {match.player1.eloChange !== null && (
                            <div className={`flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                              match.player1.eloChange >= 0
                                ? 'text-[#28a745]'
                                : 'text-[#dc3545]'
                            }`}>
                              {match.player1.eloChange >= 0 ? '+' : ''}{match.player1.eloChange}
                            </div>
                          )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                              {match.player2.name?.substring(0, 2).toUpperCase() || 'NA'}
                            </div>
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player2Won ? 'text-green-600' : ''}`}>
                                {match.player2.name}
                              </p>
                              <p className="text-sm font-normal leading-normal text-slate-600">
                                Score: {match.player2.score}
                              </p>
                            </div>
                          </div>
                          {match.player2.eloChange !== null && (
                            <div className={`flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                              match.player2.eloChange >= 0
                                ? 'text-[#28a745]'
                                : 'text-[#dc3545]'
                            }`}>
                              {match.player2.eloChange >= 0 ? '+' : ''}{match.player2.eloChange}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Matches */}
            {pendingMatches.length > 0 && (
              <div>
                <h3 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] px-0 pb-2 pt-4">
                  Pending
                </h3>
                <div className="flex flex-col gap-2">
                  {pendingMatches.map(match => (
                    <Card
                      key={match.id}
                      className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-3 min-h-[72px] justify-between rounded-xl border border-dashed border-slate-300 dark:border-slate-600 opacity-70"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 shrink-0">
                          <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                            {match.player1.name?.substring(0, 2).toUpperCase() || 'NA'}
                          </div>
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-slate-800 dark:text-slate-200 text-base font-medium leading-normal line-clamp-1">
                            {match.player1.name} vs. {match.player2.name}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-2">
                            ELO: {match.player1.eloBefore} vs {match.player2.eloBefore}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-amber-500/10 px-3 py-1">
                        <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
                          Pending
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Calendar Modal */}
      <SessionCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        currentDate={parsedDate}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/dashboard/history/[date]/page.tsx
git commit -m "feat: create history page for viewing past sessions"
```

---

## Task 10: Update primary color from #137fec to #007AFF

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Update the primary color**

Find the `colors` section in `tailwind.config.ts` and update the primary color:

```typescript
colors: {
  primary: "#007AFF", // Changed from #137fec
  // ... rest of colors
}
```

**Step 2: Verify the change works**

Run `npm run dev` and check that blue elements now use the iOS blue color.

**Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "style: update primary color to iOS blue (#007AFF)"
```

---

## Task 11: Manual testing

**Files:**
- None (testing only)

**Step 1: Test dashboard calendar integration**

1. Run `npm run dev`
2. Navigate to `/dashboard`
3. Click the date selector button
4. Verify calendar modal slides down from top
5. Verify current month is displayed
6. Verify today's date has blue border
7. Click "Today" button and verify modal closes

**Step 2: Test calendar navigation**

1. Open calendar modal
2. Click left chevron to go to previous month
3. Verify month changes
4. Click right chevron to go to next month
5. Verify month changes
6. Navigate to a month with sessions
7. Verify blue dots appear under dates with sessions

**Step 3: Test date selection**

1. Click on a date with a session (blue dot)
2. Verify navigation to `/dashboard/history/[date]`
3. Verify session data displays correctly
4. Click on a date without a session
5. Verify toast "No session on this date" appears

**Step 4: Test history page**

1. Navigate to a history page
2. Verify date is displayed correctly in header
3. Verify stats cards show correct data
4. Verify completed matches show scores and ELO changes
5. Verify pending matches show ELO ratings and pending badge
6. Verify no "Record Result" buttons appear (read-only)
7. Click back button and verify return to dashboard
8. Click date selector and verify calendar opens
9. Click "Today" button and verify return to dashboard

**Step 5: Test edge cases**

1. Manually navigate to `/dashboard/history/invalid-date`
2. Verify redirect to dashboard
3. Navigate to `/dashboard/history/2099-12-25` (future date)
4. Verify "No Matches Scheduled" empty state
5. Open calendar in multiple pages (dashboard, today, history)
6. Verify calendar works consistently across all pages

**Step 6: Document any issues**

If issues found, create separate commits to fix them.

---

## Final Verification

**Run these commands:**

```bash
# Check TypeScript compilation
npm run build

# Check for linting errors
npm run lint

# Verify all files committed
git status
```

**Expected:**
- Build succeeds with no errors
- No linting errors
- Working directory clean

---

## Implementation Complete

All tasks completed! The session calendar and history view feature is now implemented with:

✅ Calendar modal with month navigation
✅ Session date highlighting
✅ History page for viewing past sessions
✅ Read-only historical data view
✅ Proper date navigation and validation
✅ iOS blue color scheme (#007AFF)
✅ Responsive design and accessibility
✅ Month-based data caching
