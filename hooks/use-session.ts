import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Session } from '@/types';
import { format } from 'date-fns';

export function useCurrentSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sessionRef = doc(db, 'sessions', today);

    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSession({ date: today, ...snapshot.data() } as Session);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching session:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { session, loading, error };
}
