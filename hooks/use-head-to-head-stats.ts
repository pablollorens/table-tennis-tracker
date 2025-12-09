import { useMemo } from 'react';
import { MatchHistory, Player } from '@/types';

export interface HeadToHeadStat {
  opponentId: string;
  opponentName: string;
  opponent: Player;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number | null; // null when no matches
}

/**
 * Calculate head-to-head statistics for a player against all other players
 * @param matches All matches involving the current player
 * @param currentPlayerId The ID of the current player
 * @param allPlayers All players in the system
 * @returns Array of head-to-head stats sorted by total matches (desc)
 */
export function useHeadToHeadStats(
  matches: MatchHistory[],
  currentPlayerId: string,
  allPlayers: Player[]
): HeadToHeadStat[] {
  return useMemo(() => {
    // Filter out the current player from opponents list
    const opponents = allPlayers.filter(p => p.id !== currentPlayerId);

    // Calculate stats for each opponent
    const stats: HeadToHeadStat[] = opponents.map(opponent => {
      // Find matches between current player and this opponent
      const h2hMatches = matches.filter(match =>
        (match.player1Id === currentPlayerId && match.player2Id === opponent.id) ||
        (match.player2Id === currentPlayerId && match.player1Id === opponent.id)
      );

      // Count wins for current player
      const wins = h2hMatches.filter(match => match.winnerId === currentPlayerId).length;
      const losses = h2hMatches.length - wins;
      const totalMatches = h2hMatches.length;

      // Calculate win rate (null if no matches)
      const winRate = totalMatches > 0
        ? Math.round((wins / totalMatches) * 100)
        : null;

      return {
        opponentId: opponent.id,
        opponentName: opponent.name || opponent.nickname,
        opponent,
        wins,
        losses,
        totalMatches,
        winRate,
      };
    });

    // Sort by total matches (descending) - opponents with no history go to the end
    return stats.sort((a, b) => b.totalMatches - a.totalMatches);
  }, [matches, currentPlayerId, allPlayers]);
}
