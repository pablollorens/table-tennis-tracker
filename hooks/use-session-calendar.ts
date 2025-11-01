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
    // Check cache first
    if (cache.has(yearMonth)) {
      setSessionDates(cache.get(yearMonth)!);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dates = await getSessionsByMonth(yearMonth);

      // Update cache
      setCache(prev => new Map(prev).set(yearMonth, dates));
      setSessionDates(dates);
    } catch (err) {
      console.error('Error fetching session dates:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    loadMonth(initialMonth);
  }, [initialMonth, loadMonth]);

  return { sessionDates, loading, error, loadMonth };
}
