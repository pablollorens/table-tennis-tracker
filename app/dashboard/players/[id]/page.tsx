'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { isAuthenticated } from '@/lib/firebase/auth';
import { usePlayerById } from '@/hooks/use-player-by-id';
import { usePlayerMatchHistory } from '@/hooks/use-player-match-history';
import { useEloHistoryData } from '@/hooks/use-elo-history-data';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { StatsGrid } from '@/components/player/stats-grid';
import { EloHistoryChart } from '@/components/player/elo-history-chart';
import { RecentMatchesList } from '@/components/player/recent-matches-list';

export default function PlayerStatsPage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;

  const { player, loading: playerLoading, error: playerError } = usePlayerById(playerId);
  const { matches, loading: matchesLoading } = usePlayerMatchHistory(playerId);
  const eloHistory = useEloHistoryData(matches, player);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  // Handle loading state
  if (playerLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Handle error state (player not found)
  if (playerError || !player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-gray-900 text-lg font-semibold">Player not found</div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200/50 px-4 py-4 pb-2">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="text-gray-800 flex size-12 shrink-0 items-center justify-center -ml-3 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Player Name Title */}
          <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            {player.name || player.nickname}
          </h2>

          {/* Spacer for header balance */}
          <div className="size-12 shrink-0" />
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col p-4 pt-6 gap-4 items-center">
        {/* Large Avatar */}
        <PlayerAvatar
          avatar={player.avatar}
          name={player.name || player.nickname}
          size="lg"
        />

        {/* Player Info */}
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="text-gray-900 text-[28px] font-bold leading-tight tracking-[-0.015em] text-center">
            {player.name || player.nickname}
          </p>
          <p className="text-gray-500 text-base font-normal leading-normal text-center">
            Current Points: {player.eloRating}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid player={player} />

      {/* ELO History Chart */}
      <EloHistoryChart eloHistory={eloHistory} />

      {/* Recent Matches */}
      <RecentMatchesList matches={matches} playerId={playerId} />

      {/* Bottom padding for mobile nav */}
      <div className="h-24" />
    </div>
  );
}
