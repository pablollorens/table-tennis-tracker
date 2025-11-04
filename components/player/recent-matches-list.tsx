import { useMemo } from 'react';
import { MatchHistory } from '@/types';
import { PlayerAvatar } from '@/components/ui/player-avatar';
import { usePlayersByIds } from '@/hooks/use-players-by-ids';

interface RecentMatchesListProps {
  matches: MatchHistory[];
  playerId: string;
}

export function RecentMatchesList({ matches, playerId }: RecentMatchesListProps) {
  // Limit to 10 most recent matches
  const recentMatches = useMemo(() => matches.slice(0, 10), [matches]);

  // Extract all unique opponent IDs
  const opponentIds = useMemo(() => {
    return Array.from(new Set(
      recentMatches.map(match =>
        match.player1Id === playerId ? match.player2Id : match.player1Id
      )
    ));
  }, [recentMatches, playerId]);

  // Fetch opponent player data to get avatars
  const { players: opponentPlayers, loading: opponentsLoading } = usePlayersByIds(opponentIds);

  if (matches.length === 0) {
    return (
      <div className="px-4 py-6">
        <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] pb-3">
          Recent Matches
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No matches yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-[-0.015em] pb-3">
        Recent Matches
      </h2>
      <div className="flex flex-col gap-3">
        {recentMatches.map((match) => {
          // Determine if current player was player1 or player2
          const isPlayer1 = match.player1Id === playerId;
          const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
          const opponentName = isPlayer1 ? match.player2Name : match.player1Name;
          const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
          const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
          const eloChange = isPlayer1 ? match.player1EloChange : match.player2EloChange;
          const won = match.winnerId === playerId;

          // Get opponent data from fetched players
          const opponent = opponentPlayers.get(opponentId);
          const opponentAvatar = opponent?.avatar || opponentName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);

          return (
            <div
              key={match.id}
              className="flex items-center gap-4 rounded-xl p-4 bg-white border border-gray-200/80"
            >
              {/* Opponent Avatar */}
              <PlayerAvatar
                avatar={opponentAvatar}
                name={opponentName}
                size="md"
              />

              {/* Match Info */}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">vs. {opponentName}</p>
                <p className="text-sm text-gray-600">
                  Score: {playerScore}-{opponentScore}
                </p>
              </div>

              {/* Result & ELO Change */}
              <div className="text-right">
                <div
                  className={`rounded-full px-3 py-1 text-sm font-medium inline-block ${
                    won
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {won ? 'Win' : 'Loss'}
                </div>
                <p
                  className={`text-sm ${
                    eloChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {eloChange >= 0 ? '+' : ''}{eloChange} pts
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
