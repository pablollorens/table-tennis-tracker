'use client';

import { Player } from '@/types';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { cn } from '@/lib/utils';

interface PlayerAvatarFilterProps {
  players: Player[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  maxSelections?: number;
}

export function PlayerAvatarFilter({
  players,
  selectedIds,
  onSelectionChange,
  maxSelections = 2,
}: PlayerAvatarFilterProps) {
  const handleToggle = (playerId: string) => {
    if (selectedIds.includes(playerId)) {
      // Deselect
      onSelectionChange(selectedIds.filter(id => id !== playerId));
    } else if (selectedIds.length < maxSelections) {
      // Select (if under max)
      onSelectionChange([...selectedIds, playerId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {players.map(player => {
        const isSelected = selectedIds.includes(player.id);
        return (
          <button
            key={player.id}
            onClick={() => handleToggle(player.id)}
            className={cn(
              'rounded-full transition-all',
              isSelected
                ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
                : 'ring-1 ring-gray-200 hover:ring-gray-300'
            )}
            aria-label={`Filter by ${player.name}`}
            aria-pressed={isSelected}
          >
            <PlayerAvatar
              avatar={player.avatar}
              name={player.name || player.nickname}
              size="sm"
            />
          </button>
        );
      })}
    </div>
  );
}
