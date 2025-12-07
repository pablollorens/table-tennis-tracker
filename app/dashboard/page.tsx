'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useCurrentSession } from '@/hooks/use-session';
import { useEnrichedMatches } from '@/hooks/use-enriched-matches';
import { usePlayersByIds } from '@/hooks/use-players-by-ids';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { DateSelector } from '@/components/calendar/date-selector';
import { SessionCalendarModal } from '@/components/calendar/session-calendar-modal';
import { PlayerAvatarFilter } from '@/components/filters/player-avatar-filter';
import { SwipeablePendingMatch } from '@/components/matches/swipeable-pending-match';
import { MatchResultModal } from '@/components/matches/match-result-modal';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { recordMatchResult, deletePendingMatch } from '@/lib/firebase/matches';
import { Match } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { player, loading: playerLoading } = useCurrentPlayer();
  const { session, loading: sessionLoading } = useCurrentSession();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { matches, loading: matchesLoading } = useEnrichedMatches();

  // Derive player IDs from matches (not session) to catch newly added players
  const matchPlayerIds = Array.from(
    new Set(matches.flatMap(m => [m.player1.id, m.player2.id]))
  );
  const { players: sessionPlayers, loading: playersLoading } = usePlayersByIds(matchPlayerIds);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const sessionDate = format(new Date(), 'yyyy-MM-dd');
      await deletePendingMatch(sessionDate, matchId);
      toast.success('Match deleted');
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error('Failed to delete match');
    }
  };

  if (playerLoading || sessionLoading || matchesLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE, MMM d');
  const completionPercent = session
    ? Math.round((session.completedMatches / session.totalMatches) * 100)
    : 0;

  // Derive filtered matches and player list
  const playersArray = Array.from(sessionPlayers.values());
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const completedMatches = matches.filter(m => m.status === 'completed');

  // Filter pending matches based on selected players
  const filteredPendingMatches = pendingMatches.filter(match => {
    if (selectedPlayerIds.length === 0) return true;
    if (selectedPlayerIds.length === 1) {
      return match.player1.id === selectedPlayerIds[0] ||
             match.player2.id === selectedPlayerIds[0];
    }
    // 2 players selected: exact combination
    const matchPlayerIds = [match.player1.id, match.player2.id];
    return selectedPlayerIds.every(id => matchPlayerIds.includes(id));
  });

  // For empty state messages
  const hasActiveFilter = selectedPlayerIds.length > 0;
  const getFilteredPlayerNames = () => {
    return selectedPlayerIds
      .map(id => sessionPlayers.get(id)?.name || sessionPlayers.get(id)?.nickname || 'Unknown')
      .join(' & ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-6 pb-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900 flex-1 flex items-center gap-2">
            <span className="text-2xl">🏓</span>
            Office Pong
          </h1>
          <DateSelector onClick={() => setCalendarOpen(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {!session ? (
          // No Session State
          <div>
            <Card className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-4xl">🏓</span>
              </div>
              {/* Text */}
              <div className="flex flex-col gap-1">
                <h2 className="text-slate-900 text-2xl font-bold">Ready to Play?</h2>
                <p className="text-slate-600">No session has been created for today.</p>
              </div>
              {/* Button */}
              <div className="flex w-full pt-2">
                <Link href="/dashboard/player-selection" className="w-full">
                  <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold">
                    Create Today&apos;s Session
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : matches.length === 0 ? (
          // Session exists but no matches
          <div>
            <Card className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-4xl">🏓</span>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-slate-900 text-2xl font-bold">No Matches Yet</h2>
                <p className="text-slate-600">Add some matches to get started.</p>
              </div>
              <div className="flex w-full pt-2">
                <Link href="/dashboard/add-matches" className="w-full">
                  <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold">
                    + Add Matches
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          // Session Active State with matches
          <div className="flex flex-col gap-4">
            {/* Add More Matches Button */}
            <Link href="/dashboard/add-matches" className="w-full">
              <Button className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-bold">
                + Add More Matches
              </Button>
            </Link>

            {/* Completion Bar */}
            <Card className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex gap-6 justify-between items-center">
                  <p className="text-slate-900 text-base font-medium">Completion</p>
                  <p className="text-slate-600 text-sm">
                    {session.completedMatches}/{session.totalMatches}
                  </p>
                </div>
                <div className="w-full rounded-full bg-slate-200 h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Player Filter */}
            {playersArray.length > 0 && (
              <div className="py-2">
                <PlayerAvatarFilter
                  players={playersArray}
                  selectedIds={selectedPlayerIds}
                  onSelectionChange={setSelectedPlayerIds}
                />
              </div>
            )}

            {/* Filter Active Indicator */}
            {hasActiveFilter && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                Filtering by: {getFilteredPlayerNames()}
              </div>
            )}

            {/* Pending Matches Section */}
            {filteredPendingMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-bold pb-3 pt-2">
                  Pending ({filteredPendingMatches.length})
                </h2>
                <p className="text-sm text-slate-500 pb-3">
                  Swipe left to delete a match
                </p>
                {filteredPendingMatches.map(match => (
                  <SwipeablePendingMatch
                    key={match.id}
                    match={match}
                    onRecordResult={handleRecordResult}
                    onDelete={handleDeleteMatch}
                  />
                ))}
              </div>
            )}

            {/* Empty State: Filter with no results */}
            {hasActiveFilter && filteredPendingMatches.length === 0 && pendingMatches.length > 0 && (
              <div className="py-8 text-center">
                <span className="text-4xl">🔍</span>
                <p className="mt-2 text-slate-600">
                  No pending matches for {getFilteredPlayerNames()}
                </p>
              </div>
            )}

            {/* Empty State: All completed */}
            {!hasActiveFilter && pendingMatches.length === 0 && completedMatches.length > 0 && (
              <div className="py-8 text-center">
                <span className="text-4xl">🎉</span>
                <h3 className="mt-2 text-lg font-semibold">All done for today!</h3>
              </div>
            )}

            {/* Completed Matches Section */}
            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-lg font-bold pb-3 pt-2">
                  Completed ({completedMatches.length})
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
                              playerId={match.player1.id}
                              linkToProfile
                            />
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player1Won ? 'text-green-600' : ''}`}>
                                {match.player1.name}
                              </p>
                              <p className="text-sm text-slate-600">
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
                              {match.player1.eloChange >= 0 ? '+' : ''}{match.player1.eloChange}
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
                              playerId={match.player2.id}
                              linkToProfile
                            />
                            <div className="flex flex-col">
                              <p className={`text-base font-bold leading-tight ${player2Won ? 'text-green-600' : ''}`}>
                                {match.player2.name}
                              </p>
                              <p className="text-sm text-slate-600">
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
                              {match.player2.eloChange >= 0 ? '+' : ''}{match.player2.eloChange}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
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

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Calendar Modal */}
      <SessionCalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
}
