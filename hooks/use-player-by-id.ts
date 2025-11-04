import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Player } from '@/types';

export function usePlayerById(playerId: string | null) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const playerRef = doc(db, 'players', playerId);

    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlayer({ id: snapshot.id, ...snapshot.data() } as Player);
        } else {
          setPlayer(null);
          setError(new Error('Player not found'));
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching player:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [playerId]);

  return { player, loading, error };
}
