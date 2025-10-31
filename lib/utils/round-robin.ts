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
