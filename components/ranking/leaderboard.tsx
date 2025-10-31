'use client';

import { useState } from 'react';
import { usePlayers } from '@/hooks/use-players';
import { PlayerRankCard } from './player-rank-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function Leaderboard() {
  const { players, loading } = usePlayers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = players.filter(player =>
    player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Players List */}
      <div className="space-y-3">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No players found
          </div>
        ) : (
          filteredPlayers.map((player, index) => (
            <PlayerRankCard
              key={player.id}
              player={player}
              rank={index + 1}
              isCurrentUser={false} // TODO: Implement user detection
            />
          ))
        )}
      </div>
    </div>
  );
}
