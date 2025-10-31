import { Analytics, getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { app } from './config';

let analytics: Analytics | null = null;

/**
 * Initialize Firebase Analytics (only in browser)
 */
export async function initAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (analytics) {
    return analytics;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
      return analytics;
    }
  } catch (error) {
    console.warn('Firebase Analytics not supported:', error);
  }

  return null;
}

/**
 * Track custom events
 */
export async function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
): Promise<void> {
  const analyticsInstance = await initAnalytics();
  if (analyticsInstance) {
    logEvent(analyticsInstance, eventName, eventParams);
  }
}

// Predefined event tracking functions

export async function trackLogin(): Promise<void> {
  await trackEvent('login', { method: 'password' });
}

export async function trackPlayerSelection(playerCount: number): Promise<void> {
  await trackEvent('player_selection', { player_count: playerCount });
}

export async function trackMatchRecorded(
  winner: string,
  loser: string,
  score: string
): Promise<void> {
  await trackEvent('match_recorded', {
    winner,
    loser,
    score,
  });
}

export async function trackPlayerCreated(playerName: string): Promise<void> {
  await trackEvent('player_created', { player_name: playerName });
}

export async function trackPageView(pageName: string): Promise<void> {
  await trackEvent('page_view', { page_name: pageName });
}

export async function trackRoundRobinGenerated(
  matchCount: number,
  playerCount: number
): Promise<void> {
  await trackEvent('round_robin_generated', {
    match_count: matchCount,
    player_count: playerCount,
  });
}

export { analytics };
