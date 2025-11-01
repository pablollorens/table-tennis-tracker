import { useState, useEffect, useCallback } from 'react';
import { getSessionsByMonth } from '@/lib/firebase/sessions';

interface UseSessionCalendarResult {
  sessionDates: string[];
  loading: boolean;
  error: Error | null;
  loadMonth: (yearMonth: string) => Promise<void>;
}

export function useSessionCalendar(initialMonth: string): UseSessionCalendarResult {
  const [sessionDates, setSessionDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cache, setCache] = useState<Map<string, string[]>>(new Map());

  const loadMonth = useCallback(async (yearMonth: string) => {
    setLoading(true);
    setError(null);

    // Check cache using functional update to avoid dependency
    setCache(currentCache => {
      if (currentCache.has(yearMonth)) {
        setSessionDates(currentCache.get(yearMonth)!);
        setLoading(false);
        return currentCache;
      }
      return currentCache;
    });

    // If we already had it cached, the above would have returned
    // So only fetch if we need to
    setCache(currentCache => {
      if (currentCache.has(yearMonth)) {
        return currentCache;
      }

      // Fetch in the background
      getSessionsByMonth(yearMonth)
        .then(dates => {
          setCache(prev => new Map(prev).set(yearMonth, dates));
          setSessionDates(dates);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching session dates:', err);
          setError(err as Error);
          setLoading(false);
        });

      return currentCache;
    });
  }, []);

  useEffect(() => {
    loadMonth(initialMonth);
  }, [initialMonth, loadMonth]);

  return { sessionDates, loading, error, loadMonth };
}
