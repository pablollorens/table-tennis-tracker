'use client';

import { usePlayers } from '@/hooks/use-players';
import { PlayerRankCard } from './player-rank-card';
import { Skeleton } from '@/components/ui/skeleton';

export function Leaderboard() {
  const { players, loading } = usePlayers();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No players found
        </div>
      ) : (
        players.map((player, index) => (
          <PlayerRankCard
            key={player.id}
            player={player}
            rank={index + 1}
            isCurrentUser={false}
          />
        ))
      )}
    </div>
  );
}
