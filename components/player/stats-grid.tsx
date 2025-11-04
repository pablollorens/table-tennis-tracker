import { Player } from '@/types';

interface StatsGridProps {
  player: Player;
}

export function StatsGrid({ player }: StatsGridProps) {
  const { stats, eloRating } = player;

  // Format streak with W/L prefix
  const formatStreak = (streak: number): string => {
    if (streak === 0) return '-';
    const prefix = streak > 0 ? 'W' : 'L';
    return `${prefix}${Math.abs(streak)}`;
  };

  // Determine streak color
  const getStreakColor = (streak: number): string => {
    if (streak > 0) return 'text-green-500';
    if (streak < 0) return 'text-red-500';
    return 'text-gray-900';
  };

  return (
    <div className="grid grid-cols-2 gap-4 px-4 pt-4">
      {/* Total Games */}
      <div className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80 items-center text-center">
        <p className="text-gray-600 text-sm font-medium leading-normal">Total Games</p>
        <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight">
          {stats.totalMatches}
        </p>
      </div>

      {/* Win Rate */}
      <div className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80 items-center text-center">
        <p className="text-gray-600 text-sm font-medium leading-normal">Win Rate</p>
        <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight">
          {Math.round(stats.winRate * 100)}%
        </p>
      </div>

      {/* Current Points */}
      <div className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80 items-center text-center">
        <p className="text-gray-600 text-sm font-medium leading-normal">Current Points</p>
        <p className="text-[#137fec] tracking-light text-2xl font-bold leading-tight">
          {eloRating}
        </p>
      </div>

      {/* Streak */}
      <div className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80 items-center text-center">
        <p className="text-gray-600 text-sm font-medium leading-normal">Streak</p>
        <p className={`tracking-light text-2xl font-bold leading-tight ${getStreakColor(stats.currentStreak)}`}>
          {formatStreak(stats.currentStreak)}
        </p>
      </div>

      {/* Highest Points */}
      <div className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80 items-center text-center">
        <p className="text-gray-600 text-sm font-medium leading-normal">Highest Points</p>
        <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight">
          {stats.highestElo}
        </p>
      </div>

      {/* Lowest Points */}
      <div className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-200/80 items-center text-center">
        <p className="text-gray-600 text-sm font-medium leading-normal">Lowest Points</p>
        <p className="text-gray-900 tracking-light text-2xl font-bold leading-tight">
          {stats.lowestElo}
        </p>
      </div>
    </div>
  );
}
