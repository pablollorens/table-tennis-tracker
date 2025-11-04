import { Timestamp } from 'firebase/firestore';
import { MatchHistory } from '@/types';
import { reconstructEloHistory, formatEloChange } from '../reconstruct-history';

// Helper to create a mock timestamp
function createTimestamp(dateString: string): Timestamp {
  return Timestamp.fromDate(new Date(dateString));
}

// Helper to create a mock match
function createMatch(
  playerId: string,
  isPlayer1: boolean,
  eloChange: number,
  playedAt: string,
  opponentName: string = 'Opponent'
): MatchHistory {
  return {
    id: `match-${Math.random()}`,
    sessionDate: playedAt.split('T')[0],
    player1Id: isPlayer1 ? playerId : 'opponent-id',
    player1Name: isPlayer1 ? 'Test Player' : opponentName,
    player1Score: isPlayer1 ? 21 : 15,
    player1EloChange: isPlayer1 ? eloChange : -eloChange,
    player2Id: isPlayer1 ? 'opponent-id' : playerId,
    player2Name: isPlayer1 ? opponentName : 'Test Player',
    player2Score: isPlayer1 ? 15 : 21,
    player2EloChange: isPlayer1 ? -eloChange : eloChange,
    winnerId: isPlayer1 ? playerId : 'opponent-id',
    winnerName: isPlayer1 ? 'Test Player' : opponentName,
    playedAt: createTimestamp(playedAt),
    createdAt: createTimestamp(playedAt),
  };
}

describe('reconstructEloHistory', () => {
  const testPlayerId = 'player-123';
  const playerCreatedAt = createTimestamp('2025-01-01T00:00:00Z');

  it('should handle empty match history', () => {
    const result = reconstructEloHistory([], testPlayerId, 1200, playerCreatedAt);

    expect(result.history).toHaveLength(1);
    expect(result.history[0].elo).toBe(1200);
    expect(result.currentElo).toBe(1200);
    expect(result.highestElo).toBe(1200);
    expect(result.lowestElo).toBe(1200);
    expect(result.lifetimeChange).toBe(0);
  });

  it('should handle single win match', () => {
    const matches = [
      createMatch(testPlayerId, true, 16, '2025-01-05T10:00:00Z')
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    expect(result.history).toHaveLength(2); // Initial + 1 match
    expect(result.currentElo).toBe(1216);
    expect(result.highestElo).toBe(1216);
    expect(result.lowestElo).toBe(1200);
    expect(result.lifetimeChange).toBe(16);
  });

  it('should handle single loss match', () => {
    const matches = [
      createMatch(testPlayerId, false, -16, '2025-01-05T10:00:00Z')
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    expect(result.history).toHaveLength(2);
    expect(result.currentElo).toBe(1184);
    expect(result.highestElo).toBe(1200);
    expect(result.lowestElo).toBe(1184);
    expect(result.lifetimeChange).toBe(-16);
  });

  it('should handle multiple matches in correct order', () => {
    const matches = [
      createMatch(testPlayerId, true, 16, '2025-01-05T10:00:00Z'),  // Win: 1200 → 1216
      createMatch(testPlayerId, true, 15, '2025-01-06T10:00:00Z'),  // Win: 1216 → 1231
      createMatch(testPlayerId, false, -18, '2025-01-07T10:00:00Z'), // Loss: 1231 → 1213
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    expect(result.history).toHaveLength(4); // Initial + 3 matches
    expect(result.history[1].elo).toBe(1216);
    expect(result.history[2].elo).toBe(1231);
    expect(result.history[3].elo).toBe(1213);
    expect(result.currentElo).toBe(1213);
    expect(result.highestElo).toBe(1231);
    expect(result.lowestElo).toBe(1200);
    expect(result.lifetimeChange).toBe(13);
  });

  it('should handle matches in wrong order and sort them', () => {
    const matches = [
      createMatch(testPlayerId, false, -18, '2025-01-07T10:00:00Z'), // Should be 3rd
      createMatch(testPlayerId, true, 15, '2025-01-06T10:00:00Z'),  // Should be 2nd
      createMatch(testPlayerId, true, 16, '2025-01-05T10:00:00Z'),  // Should be 1st
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    // Should produce same result as sorted matches
    expect(result.history).toHaveLength(4);
    expect(result.history[1].elo).toBe(1216);
    expect(result.history[2].elo).toBe(1231);
    expect(result.history[3].elo).toBe(1213);
    expect(result.currentElo).toBe(1213);
  });

  it('should track highest and lowest ELO correctly', () => {
    const matches = [
      createMatch(testPlayerId, true, 50, '2025-01-05T10:00:00Z'),  // 1200 → 1250
      createMatch(testPlayerId, true, 60, '2025-01-06T10:00:00Z'),  // 1250 → 1310 (highest)
      createMatch(testPlayerId, false, -130, '2025-01-07T10:00:00Z'), // 1310 → 1180 (lowest)
      createMatch(testPlayerId, true, 70, '2025-01-08T10:00:00Z'),  // 1180 → 1250
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    expect(result.highestElo).toBe(1310);
    expect(result.lowestElo).toBe(1180);
    expect(result.currentElo).toBe(1250);
    expect(result.lifetimeChange).toBe(50);
  });

  it('should handle player as player2 in match', () => {
    const matches = [
      createMatch(testPlayerId, false, 16, '2025-01-05T10:00:00Z')
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    expect(result.currentElo).toBe(1216);
    expect(result.lifetimeChange).toBe(16);
  });

  it('should work without playerCreatedAt timestamp', () => {
    const matches = [
      createMatch(testPlayerId, true, 16, '2025-01-05T10:00:00Z')
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200);

    expect(result.history).toHaveLength(1); // Only the match, no initial point
    expect(result.currentElo).toBe(1216);
  });

  it('should handle custom starting ELO', () => {
    const matches = [
      createMatch(testPlayerId, true, 16, '2025-01-05T10:00:00Z')
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1500, playerCreatedAt);

    expect(result.history[0].elo).toBe(1500);
    expect(result.currentElo).toBe(1516);
    expect(result.lifetimeChange).toBe(16);
  });

  it('should format dates correctly', () => {
    const matches = [
      createMatch(testPlayerId, true, 16, '2025-01-05T10:00:00Z'),
      createMatch(testPlayerId, true, 16, '2025-12-25T10:00:00Z'),
    ];

    const result = reconstructEloHistory(matches, testPlayerId, 1200, playerCreatedAt);

    expect(result.history[0].date).toBe('Jan 01'); // Created date
    expect(result.history[1].date).toBe('Jan 05'); // First match
    expect(result.history[2].date).toBe('Dec 25'); // Second match
  });
});

describe('formatEloChange', () => {
  it('should add + prefix for positive changes', () => {
    expect(formatEloChange(16)).toBe('+16');
    expect(formatEloChange(100)).toBe('+100');
  });

  it('should keep - prefix for negative changes', () => {
    expect(formatEloChange(-16)).toBe('-16');
    expect(formatEloChange(-100)).toBe('-100');
  });

  it('should handle zero correctly', () => {
    expect(formatEloChange(0)).toBe('+0');
  });
});
