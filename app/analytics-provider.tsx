'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/firebase/analytics';

/**
 * Client component to initialize Firebase Analytics
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  return <>{children}</>;
}
