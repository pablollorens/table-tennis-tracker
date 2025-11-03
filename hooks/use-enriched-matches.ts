import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Match } from '@/types';
import { useTodayMatches } from './use-matches';
import { calculateWinProbability } from '@/lib/elo/probability';

/**
 * Hook that enriches matches with current player data:
 * - Fetches current avatars
 * - Fetches current ELO ratings
 * - Calculates win probabilities for pending matches
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

      // Fetch current player data (avatar and current ELO rating)
      const playerMap = new Map<string, { avatar?: string; currentElo?: number }>();
      await Promise.all(
        Array.from(playerIds).map(async (playerId) => {
          try {
            const playerDoc = await getDoc(doc(db, 'players', playerId));
            if (playerDoc.exists()) {
              const playerData = playerDoc.data();
              playerMap.set(playerId, {
                avatar: playerData.avatar || '',
                currentElo: playerData.eloRating || 1200,
              });
            } else {
              playerMap.set(playerId, { avatar: '', currentElo: 1200 });
            }
          } catch (err) {
            console.error(`Error fetching player ${playerId}:`, err);
            playerMap.set(playerId, { avatar: '', currentElo: 1200 });
          }
        })
      );

      // Enrich matches with current avatars, ELO, and win probabilities
      const enrichedMatches = rawMatches.map(match => {
        const player1Data = playerMap.get(match.player1.id);
        const player2Data = playerMap.get(match.player2.id);

        // Calculate win probabilities for pending matches
        let winProbabilities = null;
        if (match.status === 'pending' && player1Data?.currentElo && player2Data?.currentElo) {
          winProbabilities = calculateWinProbability(
            player1Data.currentElo,
            player2Data.currentElo
          );
        }

        return {
          ...match,
          player1: {
            ...match.player1,
            avatar: player1Data?.avatar || match.player1.avatar || '',
            currentElo: player1Data?.currentElo,
            winProbability: winProbabilities?.player1Probability,
          },
          player2: {
            ...match.player2,
            avatar: player2Data?.avatar || match.player2.avatar || '',
            currentElo: player2Data?.currentElo,
            winProbability: winProbabilities?.player2Probability,
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
