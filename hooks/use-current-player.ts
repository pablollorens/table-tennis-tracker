'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getAuthState } from '@/lib/firebase/auth';
import { Player } from '@/types';

export function useCurrentPlayer() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const authState = getAuthState();

    if (!authState.authenticated || !authState.playerId) {
      setLoading(false);
      return;
    }

    const playerRef = doc(db, 'players', authState.playerId);

    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlayer({
            id: snapshot.id,
            ...snapshot.data()
          } as Player);
        } else {
          setPlayer(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching current player:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { player, loading, error };
}
