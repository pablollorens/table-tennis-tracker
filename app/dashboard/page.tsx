'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/firebase/auth';
import { useCurrentPlayer } from '@/hooks/use-current-player';
import { useCurrentSession } from '@/hooks/use-session';
import { useTodayMatches } from '@/hooks/use-matches';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { player, loading: playerLoading } = useCurrentPlayer();
  const { session, loading: sessionLoading } = useCurrentSession();
  const { matches, loading: matchesLoading } = useTodayMatches();

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

  if (playerLoading || sessionLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE, MMM d');

  // No session created yet
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ping Pong Tracker</h1>
            <p className="text-sm text-gray-600">{today}</p>
          </div>
        </div>

        {/* Today's Session Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Today&apos;s Session</h2>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏓</div>
            <h3 className="text-lg font-semibold mb-2">Ready to Play?</h3>
            <p className="text-gray-600 mb-6">
              No session has been created for today.
            </p>
            <Link href="/dashboard/player-selection">
              <Button className="w-full h-12 text-base">
                Create Today&apos;s Session
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Session exists - show matches
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ping Pong Tracker</h1>
          <p className="text-sm text-gray-600">{today}</p>
        </div>
      </div>

      {/* Session Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Today&apos;s Session</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{session.players.length}</div>
            <div className="text-sm text-gray-600">Players</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{session.completedMatches}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{session.pendingMatches}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </Card>

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Pending Matches</h3>
          <div className="space-y-3">
            {pendingMatches.map(match => (
              <Card key={match.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">{match.player1.name}</div>
                      <div className="text-xs text-gray-500">ELO {match.player1.eloBefore}</div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-sm font-medium">{match.player2.name}</div>
                      <div className="text-xs text-gray-500">ELO {match.player2.eloBefore}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Pending
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Completed Matches</h3>
          <div className="space-y-3">
            {completedMatches.map(match => (
              <Card key={match.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`text-sm font-medium ${match.winnerId === match.player1.id ? 'text-green-600' : ''}`}>
                        {match.player1.name}
                      </div>
                      <div className="text-sm font-bold">{match.player1.score}</div>
                      {match.player1.eloChange !== null && (
                        <div className={`text-xs ${match.player1.eloChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {match.player1.eloChange >= 0 ? '+' : ''}{match.player1.eloChange}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className={`text-sm font-medium ${match.winnerId === match.player2.id ? 'text-green-600' : ''}`}>
                        {match.player2.name}
                      </div>
                      <div className="text-sm font-bold">{match.player2.score}</div>
                      {match.player2.eloChange !== null && (
                        <div className={`text-xs ${match.player2.eloChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {match.player2.eloChange >= 0 ? '+' : ''}{match.player2.eloChange}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if all matches completed */}
      {matches.length > 0 && pendingMatches.length === 0 && (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold mb-2">All Matches Complete!</h3>
            <p className="text-gray-600">
              Great job! All matches for today have been completed.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
