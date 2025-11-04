import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MatchHistory } from '@/types';

export function usePlayerMatchHistory(playerId: string | null, limitCount: number = 50) {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const matchesRef = collection(db, 'matchHistory');

    // Query for matches where player was player1 (without orderBy to avoid index requirement)
    const q1 = query(
      matchesRef,
      where('player1Id', '==', playerId)
    );

    // Query for matches where player was player2 (without orderBy to avoid index requirement)
    const q2 = query(
      matchesRef,
      where('player2Id', '==', playerId)
    );

    let unsubscribed = false;
    let player1Matches: MatchHistory[] = [];
    let player2Matches: MatchHistory[] = [];
    let loadedCount = 0;

    const updateMatches = () => {
      // Merge and deduplicate matches
      const allMatches = [...player1Matches, ...player2Matches];
      const uniqueMatches = Array.from(
        new Map(allMatches.map(m => [m.id, m])).values()
      );

      // Sort by playedAt descending and limit
      const sortedMatches = uniqueMatches
        .sort((a, b) => b.playedAt.toMillis() - a.playedAt.toMillis())
        .slice(0, limitCount);

      setMatches(sortedMatches);

      if (loadedCount >= 2) {
        setLoading(false);
      }
    };

    // Subscribe to player1 matches
    const unsubscribe1 = onSnapshot(
      q1,
      (snapshot) => {
        player1Matches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MatchHistory[];
        loadedCount++;
        if (!unsubscribed) updateMatches();
      },
      (err) => {
        console.error('Error fetching player1 match history:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Subscribe to player2 matches
    const unsubscribe2 = onSnapshot(
      q2,
      (snapshot) => {
        player2Matches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MatchHistory[];
        loadedCount++;
        if (!unsubscribed) updateMatches();
      },
      (err) => {
        console.error('Error fetching player2 match history:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribed = true;
      unsubscribe1();
      unsubscribe2();
    };
  }, [playerId, limitCount]);

  return { matches, loading, error };
}
