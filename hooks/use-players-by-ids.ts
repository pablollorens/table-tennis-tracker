import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Player } from '@/types';

/**
 * Hook to fetch multiple players by their IDs
 * Uses a single query with 'in' operator for efficiency
 */
export function usePlayersByIds(playerIds: string[]) {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerIds || playerIds.length === 0) {
      setPlayers(new Map());
      setLoading(false);
      return;
    }

    // Remove duplicates
    const uniqueIds = Array.from(new Set(playerIds));

    setLoading(true);
    setError(null);

    // Firestore 'in' operator has a limit of 30 items, so we need to batch
    const batchSize = 30;
    const batches: string[][] = [];

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      batches.push(uniqueIds.slice(i, i + batchSize));
    }

    const fetchPlayers = async () => {
      try {
        const allPlayers = new Map<string, Player>();

        for (const batch of batches) {
          const q = query(
            collection(db, 'players'),
            where('__name__', 'in', batch)
          );

          const snapshot = await getDocs(q);

          snapshot.docs.forEach(doc => {
            allPlayers.set(doc.id, {
              id: doc.id,
              ...doc.data()
            } as Player);
          });
        }

        setPlayers(allPlayers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [JSON.stringify(playerIds)]); // Use JSON.stringify for array comparison

  return { players, loading, error };
}
