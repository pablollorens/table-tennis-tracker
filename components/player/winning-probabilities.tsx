'use client';

import { HeadToHeadStat } from '@/hooks/use-head-to-head-stats';
import { PlayerAvatar } from '@/components/ui/player-avatar';

interface WinningProbabilitiesProps {
  stats: HeadToHeadStat[];
  loading?: boolean;
}

export function WinningProbabilities({ stats, loading }: WinningProbabilitiesProps) {
  if (loading) {
    return (
      <div className="px-4 py-4">
        <h3 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] pb-3">
          Winning Probabilities
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-gray-200" />
              <div className="h-4 w-8 bg-gray-200 rounded" />
              <div className="h-3 w-6 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  // Get color class based on win rate
  const getWinRateColor = (winRate: number | null): string => {
    if (winRate === null) return 'text-gray-400';
    if (winRate > 50) return 'text-green-600';
    if (winRate < 50) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="px-4 py-4">
      <h3 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] pb-3">
        Winning Probabilities
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.opponent.id}
            className="flex flex-col items-center gap-1"
          >
            <PlayerAvatar
              avatar={stat.opponent.avatar}
              name={stat.opponent.name || stat.opponent.nickname}
              size="md"
              playerId={stat.opponent.id}
              linkToProfile
            />
            <span className={`text-base font-semibold ${getWinRateColor(stat.winRate)}`}>
              {stat.winRate !== null ? `${stat.winRate}%` : '—'}
            </span>
            <span className="text-xs text-gray-400">
              ({stat.totalMatches})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
