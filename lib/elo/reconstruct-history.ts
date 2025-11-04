import { Timestamp } from 'firebase/firestore';
import { MatchHistory } from '@/types';
import { format } from 'date-fns';

export interface EloHistoryPoint {
  date: string;      // Format: "MMM dd"
  elo: number;
  timestamp: Timestamp;
}

export interface EloHistoryStats {
  history: EloHistoryPoint[];
  highestElo: number;
  lowestElo: number;
  lifetimeChange: number;
  currentElo: number;
}

/**
 * Reconstructs a player's ELO history from their match history
 *
 * @param matches - Array of match history documents (should be sorted chronologically)
 * @param playerId - ID of the player to reconstruct history for
 * @param currentPlayerElo - Current ELO rating from player document (to calculate accurate starting point)
 * @param playerCreatedAt - Timestamp when player was created (for initial point)
 * @returns ELO history points with statistics
 */
export function reconstructEloHistory(
  matches: MatchHistory[],
  playerId: string,
  currentPlayerElo: number = 1200,
  playerCreatedAt?: Timestamp
): EloHistoryStats {
  // Sort matches chronologically (oldest first)
  const sortedMatches = [...matches].sort((a, b) =>
    a.playedAt.toMillis() - b.playedAt.toMillis()
  );

  // Calculate starting ELO by working backwards from current ELO
  let totalEloChange = 0;
  for (const match of sortedMatches) {
    const isPlayer1 = match.player1Id === playerId;
    const eloChange = isPlayer1 ? match.player1EloChange : match.player2EloChange;
    totalEloChange += eloChange;
  }

  // Starting ELO = Current ELO - Total Change from all matches
  const startingElo = currentPlayerElo - totalEloChange;

  // Initialize with starting ELO
  const history: EloHistoryPoint[] = [];

  // Add initial point if we have a creation timestamp
  if (playerCreatedAt && sortedMatches.length > 0) {
    // Only add initial point if it's before the first match
    if (playerCreatedAt.toMillis() < sortedMatches[0].playedAt.toMillis()) {
      history.push({
        date: format(playerCreatedAt.toDate(), 'MMM dd'),
        elo: startingElo,
        timestamp: playerCreatedAt
      });
    }
  }

  let currentElo = startingElo;
  let highestElo = startingElo;
  let lowestElo = startingElo;

  // Build history from matches
  for (let i = 0; i < sortedMatches.length; i++) {
    const match = sortedMatches[i];

    // Determine if player was player1 or player2
    const isPlayer1 = match.player1Id === playerId;
    const eloChange = isPlayer1
      ? match.player1EloChange
      : match.player2EloChange;

    // Apply ELO change
    currentElo += eloChange;

    // Track highest/lowest
    if (currentElo > highestElo) highestElo = currentElo;
    if (currentElo < lowestElo) lowestElo = currentElo;

    // Format label: "MMM dd HH:mm" for unique identification per match
    const matchDate = match.playedAt.toDate();
    const dateLabel = format(matchDate, 'MMM dd HH:mm');

    // Add point to history
    history.push({
      date: dateLabel,
      elo: currentElo,
      timestamp: match.playedAt
    });
  }

  const lifetimeChange = currentElo - startingElo;

  return {
    history,
    highestElo,
    lowestElo,
    lifetimeChange,
    currentElo
  };
}

/**
 * Formats ELO change for display with + prefix for positive numbers
 */
export function formatEloChange(change: number): string {
  return change >= 0 ? `+${change}` : `${change}`;
}
