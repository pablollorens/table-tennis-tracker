'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useEnrichedMatches } from '@/hooks/use-enriched-matches';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchResultModal } from '@/components/matches/match-result-modal';
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { recordMatchResult } from '@/lib/firebase/matches';
import { Match } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { WinProbabilityBadge } from '@/components/match/win-probability-badge';

export default function TodayMatchesPage() {
  const router = useRouter();
  const { player, loading: playerLoading } = useCurrentPlayer();
  const { matches, loading: matchesLoading } = useEnrichedMatches();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    // Redirect inactive users to profile
    if (!playerLoading && player && !player.isActive) {
      router.push('/profile');
    }
  }, [router, playerLoading, player]);

  const handleRecordResult = (match: Match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  };

  const handleSubmitResult = async (
    matchId: string,
    player1Score: number,
    player2Score: number
  ) => {
    const sessionDate = format(new Date(), 'yyyy-MM-dd');
    const winnerId = player1Score > player2Score
      ? selectedMatch?.player1.id
      : selectedMatch?.player2.id;

    if (!winnerId) {
      throw new Error('Could not determine winner');
    }

    await recordMatchResult(sessionDate, matchId, {
      player1Score,
      player2Score,
      winnerId,
    });
  };

  if (playerLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE, MMMM d');
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-4 pb-2">
          <button
            onClick={() => router.back()}
            className="touch-target p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold leading-tight tracking-tight flex-1">
            Today&apos;s Matches
          </h1>
          <DateSelector onClick={() => setCalendarOpen(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Pending Matches Section */}
        {pendingMatches.length > 0 && (
          <div>
            <h2 className="text-lg font-bold leading-tight tracking-tight pb-3 pt-4">
              Pending
            </h2>
            {pendingMatches.map(match => (
              <Card key={match.id} className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm mb-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Player 1 */}
                  <div className="flex flex-1 items-center gap-3">
                    <PlayerAvatar
                      avatar={match.player1.avatar}
                      name={match.player1.name}
                      size="sm"
                    />
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold leading-tight">
                        {match.player1.name}
                      </p>
                      {match.player1.winProbability !== undefined ? (
                        <WinProbabilityBadge probability={match.player1.winProbability} />
                      ) : (
                        <p className="text-sm font-normal leading-normal text-slate-600">
                          Points: {match.player1.eloBefore}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-500">vs</p>

                  {/* Player 2 */}
                  <div className="flex flex-1 items-center justify-end gap-3 text-right">
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-bold leading-tight">
                        {match.player2.name}
                      </p>
                      {match.player2.winProbability !== undefined ? (
                        <WinProbabilityBadge probability={match.player2.winProbability} />
                      ) : (
                        <p className="text-sm font-normal leading-normal text-slate-600">
                          Points: {match.player2.eloBefore}
                        </p>
                      )}
                    </div>
                    <PlayerAvatar
                      avatar={match.player2.avatar}
                      name={match.player2.name}
                      size="sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleRecordResult(match)}
                  className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700"
                >
                  Record Result
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Completed Matches Section */}
        {completedMatches.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-bold leading-tight tracking-tight pb-3 pt-4">
              Completed
            </h2>
            {completedMatches.map(match => {
              const player1Won = match.winnerId === match.player1.id;
              const player2Won = match.winnerId === match.player2.id;

              return (
                <Card
                  key={match.id}
                  className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm mb-4 border border-green-500/50"
                >
                  <div className="flex flex-col gap-3">
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
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {matches.length === 0 && (
          <div className="mt-8 text-center">
            <span className="text-5xl">😔</span>
            <h3 className="mt-2 text-lg font-semibold">No matches today!</h3>
            <p className="mt-1 text-sm text-slate-600">
              Create a session to get started.
            </p>
          </div>
        )}

        {/* All Completed State */}
        {matches.length > 0 && pendingMatches.length === 0 && (
          <div className="mt-8 text-center">
            <span className="text-5xl">🎉</span>
            <h3 className="mt-2 text-lg font-semibold">No more matches today!</h3>
            <p className="mt-1 text-sm text-slate-600">
              All matches have been completed. Great job!
            </p>
          </div>
        )}
      </main>

      {/* Match Result Modal */}
      <MatchResultModal
        match={selectedMatch}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitResult}
      />

      {/* Calendar Modal */}
      <SessionCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
}
