import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MatchHistory } from '@/types';
import { reconstructMonthlyEloHistory, MonthlyEloData } from '@/lib/elo/reconstruct-monthly-history';

/**
 * Hook to fetch all match history and transform it into monthly ELO data
 *
 * @returns Monthly ELO data for chart rendering
 */
export function useMonthlyEloData() {
  const [matches, setMatches] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const matchesRef = collection(db, 'matchHistory');

    const unsubscribe = onSnapshot(
      matchesRef,
      (snapshot) => {
        const allMatches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MatchHistory[];

        setMatches(allMatches);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching all match history:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const data = useMemo(() => {
    if (matches.length === 0) {
      return { players: [], months: [] } as MonthlyEloData;
    }
    return reconstructMonthlyEloHistory(matches);
  }, [matches]);

  return { data, loading, error };
}
