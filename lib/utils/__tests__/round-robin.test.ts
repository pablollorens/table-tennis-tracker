import { generateRoundRobin, calculateTotalMatches } from '../round-robin';

describe('Round Robin Generator', () => {
  describe('generateRoundRobin', () => {
    it('should generate correct matches for 3 players', () => {
      const matches = generateRoundRobin(['p1', 'p2', 'p3']);

      expect(matches).toHaveLength(3);
      expect(matches).toContainEqual({ player1Id: 'p1', player2Id: 'p2' });
      expect(matches).toContainEqual({ player1Id: 'p1', player2Id: 'p3' });
      expect(matches).toContainEqual({ player1Id: 'p2', player2Id: 'p3' });
    });

    it('should generate correct matches for 4 players', () => {
      const matches = generateRoundRobin(['p1', 'p2', 'p3', 'p4']);

      expect(matches).toHaveLength(6);
    });

    it('should not include duplicate pairings', () => {
      const matches = generateRoundRobin(['p1', 'p2', 'p3']);
      const pairings = matches.map(m => `${m.player1Id}-${m.player2Id}`);
      const uniquePairings = new Set(pairings);

      expect(pairings.length).toBe(uniquePairings.size);
    });

    it('should handle 2 players (minimum)', () => {
      const matches = generateRoundRobin(['p1', 'p2']);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ player1Id: 'p1', player2Id: 'p2' });
    });
  });

  describe('calculateTotalMatches', () => {
    it('should calculate correct number for various player counts', () => {
      expect(calculateTotalMatches(2)).toBe(1);
      expect(calculateTotalMatches(3)).toBe(3);
      expect(calculateTotalMatches(4)).toBe(6);
      expect(calculateTotalMatches(5)).toBe(10);
      expect(calculateTotalMatches(6)).toBe(15);
    });
  });
});
