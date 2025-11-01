import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Match } from '@/types';
import { useTodayMatches } from './use-matches';

/**
 * Hook that enriches matches with current player avatar data
 * This ensures avatars are always up-to-date, even for historical matches
 */
export function useEnrichedMatches(date?: string) {
  const { matches: rawMatches, loading: matchesLoading, error } = useTodayMatches(date);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function enrichMatches() {
      if (matchesLoading) {
        setLoading(true);
        return;
      }

      if (rawMatches.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get unique player IDs
      const playerIds = new Set<string>();
      rawMatches.forEach(match => {
        playerIds.add(match.player1.id);
        playerIds.add(match.player2.id);
      });

      // Fetch current player data
      const playerMap = new Map<string, { avatar?: string }>();
      await Promise.all(
        Array.from(playerIds).map(async (playerId) => {
          try {
            const playerDoc = await getDoc(doc(db, 'players', playerId));
            if (playerDoc.exists()) {
              const playerData = playerDoc.data();
              playerMap.set(playerId, {
                avatar: playerData.avatar || '',
              });
            } else {
              playerMap.set(playerId, { avatar: '' });
            }
          } catch (err) {
            console.error(`Error fetching player ${playerId}:`, err);
            playerMap.set(playerId, { avatar: '' });
          }
        })
      );

      // Enrich matches with current avatars
      const enrichedMatches = rawMatches.map(match => {
        const player1Data = playerMap.get(match.player1.id);
        const player2Data = playerMap.get(match.player2.id);

        return {
          ...match,
          player1: {
            ...match.player1,
            avatar: player1Data?.avatar || match.player1.avatar || '',
          },
          player2: {
            ...match.player2,
            avatar: player2Data?.avatar || match.player2.avatar || '',
          },
        };
      });

      setMatches(enrichedMatches);
      setLoading(false);
    }

    enrichMatches();
  }, [rawMatches, matchesLoading]);

  return { matches, loading, error };
}
