'use client';

import { useRouter } from 'next/navigation';
import { Player } from '@/types';
import { cn } from '@/lib/utils';
import { Flame, Snowflake, Medal } from 'lucide-react';
import { PlayerAvatar } from '@/components/ui/player-avatar';

interface PlayerRankCardProps {
  player: Player;
  rank: number;
  isCurrentUser?: boolean;
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'border-yellow-400';
  if (rank === 2) return 'border-gray-400';
  if (rank === 3) return 'border-orange-400';
  return 'border-gray-200';
}

function getRankBadge(rank: number) {
  if (rank === 1) return <Medal className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-400 fill-gray-400" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-orange-500 fill-orange-500" />;
  return null;
}

function getStreakDisplay(streak: number) {
  if (streak === 0) return null;

  const isWinStreak = streak > 0;
  const absStreak = Math.abs(streak);

  return (
    <div className={cn(
      'flex items-center gap-1 text-sm',
      isWinStreak ? 'text-orange-500' : 'text-blue-400'
    )}>
      {isWinStreak ? (
        <Flame className="w-4 h-4 fill-current" />
      ) : (
        <Snowflake className="w-4 h-4 fill-current" />
      )}
      <span className="font-semibold">
        {isWinStreak ? 'W' : 'L'}{absStreak}
      </span>
    </div>
  );
}

export function PlayerRankCard({ player, rank, isCurrentUser }: PlayerRankCardProps) {
  const router = useRouter();
  const winRate = player.stats.totalMatches > 0
    ? Math.round((player.stats.wins / player.stats.totalMatches) * 100)
    : 0;

  const handleClick = () => {
    router.push(`/dashboard/players/${player.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative overflow-hidden rounded-xl border-2 bg-white shadow-sm w-full text-left transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer',
        getRankColor(rank),
        isCurrentUser && 'border-blue-500 bg-blue-50/50'
      )}
    >
      {/* Rank Badge for Top 3 */}
      {rank <= 3 && (
        <div className={cn(
          'absolute -left-8 -top-8 h-16 w-16 rotate-[-45deg] pt-11 text-center',
          rank === 1 && 'bg-yellow-400',
          rank === 2 && 'bg-gray-400',
          rank === 3 && 'bg-orange-400'
        )}>
          {getRankBadge(rank)}
        </div>
      )}

      <div className="flex items-center gap-4 p-4">
        {/* Rank Number */}
        <div className="w-8 shrink-0 text-center text-xl font-bold text-gray-400">
          {rank}
        </div>

        {/* Avatar */}
        <PlayerAvatar
          avatar={player.avatar}
          name={player.name || undefined}
          size="md"
          className="shrink-0"
        />

        {/* Player Info */}
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-gray-800 truncate">
            {player.name}
            {isCurrentUser && (
              <span className="ml-2 text-sm text-blue-600">(You)</span>
            )}
          </p>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span className="font-mono">
              {player.stats.wins}-{player.stats.losses} ({winRate}%)
            </span>
            {getStreakDisplay(player.stats.currentStreak)}
          </div>
        </div>

        {/* Points Rating */}
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-blue-600">{player.eloRating}</p>
          <p className="text-xs text-gray-400">Points</p>
        </div>
      </div>
    </button>
  );
}
