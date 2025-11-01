'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useCurrentSession } from '@/hooks/use-session';
import { useEnrichedMatches } from '@/hooks/use-enriched-matches';
import { Card } from '@/components/ui/card';
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { format, parse, isValid } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/player-avatar';

export default function HistoryPage() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;
  const { player, loading: playerLoading } = useCurrentPlayer();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [parsedDate, setParsedDate] = useState<Date | null>(null);

  // Validate and parse date parameter
  useEffect(() => {
    if (!dateParam) {
      router.push('/dashboard');
      return;
    }

    try {
      const date = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (!isValid(date)) {
        router.push('/dashboard');
        return;
      }
      setParsedDate(date);
    } catch {
      router.push('/dashboard');
    }
  }, [dateParam, router]);

  const { session, loading: sessionLoading } = useCurrentSession(dateParam);
  const { matches, loading: matchesLoading } = useEnrichedMatches(dateParam);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    if (!playerLoading && player && !player.isActive) {
      router.push('/profile');
    }
  }, [router, playerLoading, player]);

  if (playerLoading || sessionLoading || matchesLoading || !parsedDate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const completedMatches = matches.filter(m => m.status === 'completed');
  const pendingMatches = matches.filter(m => m.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            aria-label="Back to dashboard"
            className="text-slate-800 dark:text-slate-200 flex size-12 shrink-0 items-center justify-start hover:bg-slate-100 rounded-lg p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {format(parsedDate, 'MMMM d, yyyy')}
          </h2>
          <DateSelector date={parsedDate} onClick={() => setCalendarOpen(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {!session ? (
          // No Session State
          <div className="flex flex-col items-center justify-center text-center p-8 mt-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-5xl mb-4">📅</span>
            <h4 className="text-slate-800 dark:text-slate-200 text-lg font-semibold">
              No Matches Scheduled
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              No matches were played on this day.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Section */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-300 text-base font-medium leading-normal">
                  Total Matches
                </p>
                <p className="text-slate-900 dark:text-slate-50 tracking-tight text-3xl font-bold leading-tight">
                  {session.totalMatches}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-300 text-base font-medium leading-normal">
                  Completed
                </p>
                <p className="text-slate-900 dark:text-slate-50 tracking-tight text-3xl font-bold leading-tight">
                  {session.completedMatches}
                </p>
              </div>
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl bg-white dark:bg-slate-800 p-6 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-800 dark:text-slate-300 text-base font-medium leading-normal">
                  Pending
                </p>
                <p className="text-slate-900 dark:text-slate-50 tracking-tight text-3xl font-bold leading-tight">
                  {session.pendingMatches}
                </p>
              </div>
            </div>

            {/* Completed Matches */}
            {completedMatches.length > 0 && (
              <div className="mb-6">
                <h3 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] px-0 pb-2 pt-4">
                  Completed
                </h3>
                <div className="flex flex-col gap-2">
                  {completedMatches.map(match => {
                    const player1Won = match.winnerId === match.player1.id;
                    const player2Won = match.winnerId === match.player2.id;

                    return (
                      <Card
                        key={match.id}
                        className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-slate-200 dark:border-slate-700"
                      >
                        {/* Player 1 */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              avatar={match.player1.avatar}
                              name={match.player1.name}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player1Won ? 'text-green-600' : ''}`}>
                                {match.player1.name}
                              </p>
                              <p className="text-sm font-normal leading-normal text-slate-600">
                                Score: {match.player1.score}
                              </p>
                            </div>
                          </div>
                          {match.player1.eloChange !== null && (
                            <div className={`flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                              match.player1.eloChange >= 0
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              {match.player1.eloChange >= 0 ? '+' : ''}{match.player1.eloChange} Points
                            </div>
                          )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar
                              avatar={match.player2.avatar}
                              name={match.player2.name}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player2Won ? 'text-green-600' : ''}`}>
                                {match.player2.name}
                              </p>
                              <p className="text-sm font-normal leading-normal text-slate-600">
                                Score: {match.player2.score}
                              </p>
                            </div>
                          </div>
                          {match.player2.eloChange !== null && (
                            <div className={`flex h-6 items-center justify-center rounded-full px-2.5 text-xs font-semibold ${
                              match.player2.eloChange >= 0
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              {match.player2.eloChange >= 0 ? '+' : ''}{match.player2.eloChange} Points
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Matches */}
            {pendingMatches.length > 0 && (
              <div>
                <h3 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em] px-0 pb-2 pt-4">
                  Pending
                </h3>
                <div className="flex flex-col gap-2">
                  {pendingMatches.map(match => (
                    <Card
                      key={match.id}
                      className="flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-3 min-h-[72px] justify-between rounded-xl border border-dashed border-slate-300 dark:border-slate-600 opacity-70"
                    >
                        <div className="flex items-center gap-4">
                          <PlayerAvatar
                            avatar={match.player1.avatar}
                            name={match.player1.name}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="flex flex-col justify-center">
                            <p className="text-slate-800 dark:text-slate-200 text-base font-medium leading-normal line-clamp-1">
                              {match.player1.name} vs. {match.player2.name}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-2">
                              Points: {match.player1.eloBefore} vs {match.player2.eloBefore}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-amber-500/10 px-3 py-1">
                          <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
                            Pending
                          </p>
                        </div>
                      </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Calendar Modal */}
      <SessionCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        currentDate={parsedDate}
      />
    </div>
  );
}
