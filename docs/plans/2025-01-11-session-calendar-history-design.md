# Session Calendar and History View Design

**Date:** 2025-01-11
**Feature:** Calendar date selector for viewing historical sessions

## Overview

Add a calendar component that allows users to navigate between different session dates, view historical data, and return to today's session. The date header becomes clickable, opening a calendar modal that shows which dates have sessions.

## Requirements

### Functional Requirements
- Date header is clickable throughout the app
- Calendar modal displays one month at a time with navigation
- Dates with sessions are visually highlighted (blue dot indicator)
- Clicking a highlighted date navigates to history view for that date
- Clicking an empty date shows toast: "No session on this date"
- "Today" button navigates back to current date
- History view is read-only (no recording/editing results)
- History view shows session stats and all matches (completed and pending)

### User Experience
- Calendar slides down from top (70vh height)
- Month-by-month data loading (load visible month only)
- Data cached per month to avoid redundant queries
- Toast notifications for empty dates
- Proper accessibility with aria-labels

## Architecture

### Component Structure

**1. DateSelector Component** (`components/calendar/date-selector.tsx`)
- Displays current/selected date as a clickable button
- Shows "Today" for current date, formatted date for historical views
- Opens calendar modal on click
- Positioned in existing header area

**2. SessionCalendarModal Component** (`components/calendar/session-calendar-modal.tsx`)
- Dialog that slides down from top (70vh height, rounded-b-xl)
- Month navigation with chevron buttons
- 7-column calendar grid (S M T W T F S)
- Highlights dates with sessions (blue dot indicator)
- Single "Today" button at bottom
- Toast for "No session on this date"
- Clicking highlighted date navigates to `/dashboard/history/[date]`

**3. History Page** (`app/dashboard/history/[date]/page.tsx`)
- Dynamic route accepting date parameter (e.g., `/dashboard/history/2025-10-25`)
- Read-only view of session data
- Displays session stats and matches
- Date header remains clickable
- Back button returns to dashboard
- No "Record Result" buttons
- No bottom navigation

### Data Layer

**Hook: useSessionCalendar** (`hooks/use-session-calendar.ts`)
- Accepts month/year parameter (e.g., "2025-10")
- Queries Firestore sessions collection for date range
- Filters to only sessions with `totalMatches > 0`
- Returns array of date strings that have sessions
- Implements month-based caching using Map or state

**Modified Hooks:**
- `useCurrentSession()` - Add optional `date` parameter
- `useTodayMatches()` - Add optional `date` parameter (rename to `useMatches`?)

**Firestore Query Strategy:**
```typescript
// For month "2025-10":
collection(db, 'sessions')
  .where('date', '>=', '2025-10-01')
  .where('date', '<=', '2025-10-31')
  .where('totalMatches', '>', 0)
```

**Caching:**
- Cache results per month: `Map<string, string[]>` where key is 'YYYY-MM'
- Fetch only when navigating to uncached month
- Use `useMemo` or local state for cache management

### Navigation Flow

1. User clicks date header → Calendar modal slides down
2. Calendar loads session dates for current month
3. User navigates to different month → Fetch and cache that month's sessions
4. User clicks highlighted date (e.g., Oct 25) → Navigate to `/dashboard/history/2025-10-25`
5. History page loads session and matches for that date
6. User clicks date header → Calendar opens again
7. User clicks "Today" button → Navigate to `/dashboard`

## UI Specifications

### Calendar Modal Design
Based on `docs/design_specs/stitch_player_selection_screen/session_calendar_modal`

**Layout:**
- Slides down from top (NOT bottom sheet)
- Height: 70vh
- Border radius: `rounded-b-xl`
- Background: `#F7F7F7` (light), `#101922` (dark)
- Backdrop overlay: `bg-black/40`

**Month Navigation:**
- Left/right chevron buttons: `size-12`, `text-primary` (`#007AFF`)
- Center: "October 2025" (text-lg, font-bold, clickable)

**Calendar Grid:**
- Day labels: 7 columns (S M T W T F S)
  - Style: `text-[#8E8E93]`, text-xs, font-bold, h-10
- Date cells: 7x5/6 grid
  - Height: h-12 (48px)
  - Default: `text-[#333333]` / `text-white` (dark mode)
  - Has session: Blue dot (h-1.5 w-1.5, `bg-primary`, absolute bottom-2)
  - Selected: Full circle `bg-blue-600`, white text
  - Today (unselected): Border circle `border-2 border-primary`, blue text
  - Outside month: `text-gray-400`, disabled, cursor-not-allowed

**Today Button:**
- Full width, h-12
- `bg-primary` (`#007AFF`), white text, font-bold
- Bottom padding: p-4

**Toast Notification:**
- Background: `bg-gray-800`, white text
- Rounded: `rounded-full`
- Position: bottom center, z-30
- Message: "No session on this date"

### History Page Design
Based on `docs/design_specs/stitch_player_selection_screen/history_session_details_screen`

**Header:**
- Back button (arrow_back icon) on left
- Centered date: "October 25, 2025" (text-lg, font-bold) with blue expand_more icon
- Date is clickable to open calendar

**Session Stats:**
- 3 stat cards: Total Matches, Completed, Pending
- White background, rounded-xl, border
- Value in text-2xl bold below label (text-base)

**Match List:**
- **Completed matches:**
  - Solid border
  - Shows final score and ELO changes
  - Green for gains (+12), red for losses (-12)
- **Pending matches:**
  - Dashed border `border-dashed border-slate-300`
  - 70% opacity
  - Shows current ELO ratings
  - Amber "PENDING" badge

**Empty State:**
- Calendar icon (material-symbols-outlined)
- Heading: "No Matches Scheduled"
- Subtext: "No matches were played on this day."

### Color System Update

**Primary Color Change:**
- Old: `#137fec`
- New: `#007AFF` (iOS blue)
- Update across entire app for consistency

**Semantic Colors:**
- ELO gain: `#28a745` (green)
- ELO loss: `#dc3545` (red)
- Background light: `#F7F7F7`
- Background dark: `#101922`

### Accessibility

**Calendar Modal:**
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` for heading
- Date buttons: `aria-label="October 1, 2025, has sessions"`
- Selected date: `aria-current="date"`
- Navigation: `aria-label="Previous month"`, `aria-label="Next month"`
- Disabled dates: `disabled` attribute, `cursor-not-allowed`

**Keyboard Navigation:**
- ESC key to close modal
- Tab/Shift+Tab through interactive elements
- Enter/Space to activate buttons

## Implementation Files

### New Files
1. `components/calendar/session-calendar-modal.tsx` - Calendar modal
2. `components/calendar/date-selector.tsx` - Clickable date header
3. `hooks/use-session-calendar.ts` - Fetch sessions by month
4. `app/dashboard/history/[date]/page.tsx` - History page
5. `lib/firebase/sessions.ts` - Add `getSessionsByMonth()` function

### Modified Files
1. `app/dashboard/page.tsx` - Use DateSelector component
2. `app/dashboard/today/page.tsx` - Use DateSelector component
3. `hooks/use-session.ts` - Add optional `date` parameter
4. `hooks/use-matches.ts` - Add optional `date` parameter

## Edge Cases

1. **Invalid date in history route:** Redirect to `/dashboard`
2. **Empty months:** Show calendar with no highlighted dates
3. **Future dates:** Allow selection but show "No session on this date" toast
4. **Timezone handling:** Use consistent date-fns formatting (YYYY-MM-DD)
5. **Loading states:** Show skeleton/spinner while fetching month data
6. **Network errors:** Show error toast, fallback to cached data
7. **No sessions ever:** Calendar works but shows no highlighted dates

## Performance Considerations

- Each month query is lightweight (~31 documents max)
- Firestore automatically indexes date range queries
- Initial load fetches current month only
- Subsequent months load on-demand
- Cache prevents redundant fetches for previously viewed months
- Use `useMemo` to prevent unnecessary re-renders

## Testing Checklist

- [ ] Date header opens calendar modal
- [ ] Calendar highlights dates with sessions
- [ ] Month navigation works (prev/next)
- [ ] Clicking highlighted date navigates to history view
- [ ] Clicking empty date shows toast
- [ ] "Today" button returns to current date
- [ ] History view displays correct session data
- [ ] History view is read-only (no edit buttons)
- [ ] Back button from history returns to dashboard
- [ ] Date selector works in history view
- [ ] Calendar caches month data correctly
- [ ] Accessibility attributes are correct
- [ ] Keyboard navigation works
- [ ] Dark mode displays correctly
- [ ] Mobile/tablet layouts work
- [ ] Edge cases handled (invalid dates, empty months, etc.)
