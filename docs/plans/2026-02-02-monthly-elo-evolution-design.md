# Monthly ELO Evolution Chart

## Overview

Feature to display a line chart showing the ELO evolution of all players over time, aggregated by month.

## Requirements

- Line chart where each line represents a player
- Y-axis: cumulative ELO points at end of each month
- X-axis: months in format "MM/YY" (e.g., "01/25", "02/25")
- Players who join later start their line from their first month with matches
- Last closed month shows solid line; current month shows dashed line (partial data)
- Secret page for testing: `/dashboard/ranking/evolution` (no UI buttons to access)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Calculation approach | Recalculate from scratch | Simple, no cache needed, fast enough for ~1 year of data |
| Charting library | Chart.js + react-chartjs-2 | Already used in the project |
| Code structure | New separate function | Don't modify existing `reconstructEloHistory` |
| Color assignment | Dynamic HSL palette | Scales with any number of players |
| Interactivity | Minimal (hover tooltip + legend toggle) | Sufficient for v1 testing |

## Data Structures

```typescript
// /lib/elo/reconstruct-monthly-history.ts

interface MonthlyEloPoint {
  month: string;        // "01/25", "02/25"
  elo: number;
  isPartial: boolean;   // true for current month
}

interface PlayerMonthlyHistory {
  playerId: string;
  playerName: string;
  color: string;
  data: MonthlyEloPoint[];
}

interface MonthlyEloData {
  players: PlayerMonthlyHistory[];
  months: string[];     // Ordered list of all months
}
```

## File Structure

```
/app/dashboard/ranking/evolution/page.tsx    # Secret page
/components/ranking/monthly-elo-chart.tsx    # Chart component
/lib/elo/reconstruct-monthly-history.ts      # Calculation logic
/hooks/use-monthly-elo-data.ts               # Data fetching hook
```

## Algorithm

1. Fetch all `matchHistory` documents from Firestore
2. Group matches by player and sort chronologically
3. For each player:
   - Start at ELO 1200
   - Apply each match's `eloChange` in order
   - At end of each month, record the cumulative ELO
   - If player has no matches in a month, carry forward previous value
   - Mark current month as `isPartial: true`
4. Generate color palette using HSL with maximum hue separation
5. Return structured data for chart rendering

## Component Behavior

### MonthlyEloChart
- Uses Chart.js `<Line />` component
- Multiple datasets (one per player)
- Tooltip shows: player name, month, ELO value
- Legend at bottom, clickable to show/hide players
- Last segment rendered with `borderDash: [5, 5]` for partial month
- Responsive with min-height 300px

### Page
- Same styling as existing app (white card, gray background)
- Header with back button to `/dashboard/ranking`
- No navigation links to this page (secret for testing)

## Future Enhancements (not in v1)

- Date range selector
- Player filter checkboxes
- Export to image
- Make page public with button in ranking
