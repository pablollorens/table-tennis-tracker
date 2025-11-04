import { useMemo } from 'react';
import { MatchHistory, Player } from '@/types';
import { reconstructEloHistory, EloHistoryStats } from '@/lib/elo/reconstruct-history';

/**
 * Hook to transform match history into ELO history chart data
 *
 * @param matches - Array of match history documents
 * @param player - Player document
 * @returns ELO history stats with chart-ready data
 */
export function useEloHistoryData(
  matches: MatchHistory[],
  player: Player | null
): EloHistoryStats | null {
  return useMemo(() => {
    if (!player || !matches) {
      return null;
    }

    return reconstructEloHistory(
      matches,
      player.id,
      player.eloRating, // Use current ELO to calculate accurate starting point
      player.createdAt
    );
  }, [matches, player]);
}
