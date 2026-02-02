import { MatchHistory } from '@/types';
import { format, endOfMonth, isSameMonth, isAfter } from 'date-fns';

export interface MonthlyEloPoint {
  month: string;        // "01/25", "02/25"
  elo: number;
  isPartial: boolean;   // true for current month
}

export interface PlayerMonthlyHistory {
  playerId: string;
  playerName: string;
  color: string;
  data: MonthlyEloPoint[];
}

export interface MonthlyEloData {
  players: PlayerMonthlyHistory[];
  months: string[];     // Ordered list of all months
}

interface PlayerMatchData {
  playerId: string;
  playerName: string;
  matches: { date: Date; eloChange: number }[];
}

/**
 * Generate a color palette with maximum hue separation
 */
function generateColorPalette(count: number): string[] {
  const colors: string[] = [];
  const saturation = 70;
  const lightness = 50;

  for (let i = 0; i < count; i++) {
    const hue = (i * 360 / count) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}

/**
 * Format a date to month string "MM/YY"
 */
function formatMonth(date: Date): string {
  return format(date, 'MM/yy');
}

/**
 * Get all unique months between start and end dates
 */
function getMonthRange(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * Reconstructs monthly ELO history for all players from match history
 *
 * @param matches - Array of all match history documents
 * @returns Monthly ELO data for all players
 */
export function reconstructMonthlyEloHistory(
  matches: MatchHistory[]
): MonthlyEloData {
  if (!matches || matches.length === 0) {
    return { players: [], months: [] };
  }

  // Sort matches chronologically (oldest first)
  const sortedMatches = [...matches].sort((a, b) =>
    a.playedAt.toMillis() - b.playedAt.toMillis()
  );

  // Group matches by player
  const playerMatches = new Map<string, PlayerMatchData>();

  for (const match of sortedMatches) {
    const matchDate = match.playedAt.toDate();

    // Process player1
    if (!playerMatches.has(match.player1Id)) {
      playerMatches.set(match.player1Id, {
        playerId: match.player1Id,
        playerName: match.player1Name,
        matches: []
      });
    }
    playerMatches.get(match.player1Id)!.matches.push({
      date: matchDate,
      eloChange: match.player1EloChange
    });

    // Process player2
    if (!playerMatches.has(match.player2Id)) {
      playerMatches.set(match.player2Id, {
        playerId: match.player2Id,
        playerName: match.player2Name,
        matches: []
      });
    }
    playerMatches.get(match.player2Id)!.matches.push({
      date: matchDate,
      eloChange: match.player2EloChange
    });
  }

  // Find date range
  const firstMatchDate = sortedMatches[0].playedAt.toDate();
  const now = new Date();
  const allMonths = getMonthRange(firstMatchDate, now);
  const monthStrings = allMonths.map(formatMonth);

  // Current month info for partial detection
  const currentMonthEnd = endOfMonth(now);

  // Generate colors
  const colors = generateColorPalette(playerMatches.size);

  // Build monthly history for each player
  const players: PlayerMonthlyHistory[] = [];
  let colorIndex = 0;

  for (const [playerId, playerData] of playerMatches) {
    const { playerName, matches: playerMatchList } = playerData;

    // Find player's first match month
    const firstPlayerMatchDate = playerMatchList[0].date;
    const firstPlayerMonth = new Date(
      firstPlayerMatchDate.getFullYear(),
      firstPlayerMatchDate.getMonth(),
      1
    );

    // Calculate ELO at end of each month
    let currentElo = 1200;
    const data: MonthlyEloPoint[] = [];

    for (const month of allMonths) {
      // Skip months before player's first match
      if (month < firstPlayerMonth) {
        continue;
      }

      const monthEnd = endOfMonth(month);
      const isCurrentMonth = isSameMonth(month, now);

      // Sum all elo changes for matches in this month
      for (const match of playerMatchList) {
        if (
          match.date.getFullYear() === month.getFullYear() &&
          match.date.getMonth() === month.getMonth()
        ) {
          currentElo += match.eloChange;
        }
      }

      data.push({
        month: formatMonth(month),
        elo: currentElo,
        isPartial: isCurrentMonth
      });
    }

    players.push({
      playerId,
      playerName,
      color: colors[colorIndex],
      data
    });

    colorIndex++;
  }

  // Sort players by current ELO (highest first)
  players.sort((a, b) => {
    const aLastElo = a.data.length > 0 ? a.data[a.data.length - 1].elo : 1200;
    const bLastElo = b.data.length > 0 ? b.data[b.data.length - 1].elo : 1200;
    return bLastElo - aLastElo;
  });

  return {
    players,
    months: monthStrings
  };
}
