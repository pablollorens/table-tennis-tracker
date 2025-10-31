import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Player } from '@/types';

export function usePlayers(activeOnly: boolean = true) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const playersRef = collection(db, 'players');

    let q = query(playersRef, orderBy('eloRating', 'desc'));

    if (activeOnly) {
      q = query(
        playersRef,
        where('isActive', '==', true),
        orderBy('eloRating', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[];

        setPlayers(playersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching players:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeOnly]);

  return { players, loading, error };
}
