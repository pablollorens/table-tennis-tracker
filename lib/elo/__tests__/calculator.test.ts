import { calculateEloChange, predictMatchOutcome } from '../calculator';

describe('ELO Calculator', () => {
  describe('calculateEloChange', () => {
    it('should give many points when weak player beats strong player', () => {
      const result = calculateEloChange({
        winnerElo: 1000,
        loserElo: 1400,
        kFactor: 32
      });

      expect(result.winnerChange).toBeGreaterThan(20);
      expect(result.loserChange).toBeLessThan(-20);
      expect(result.winnerNewElo).toBe(1000 + result.winnerChange);
      expect(result.loserNewElo).toBe(1400 + result.loserChange);
    });

    it('should give few points when strong player beats weak player', () => {
      const result = calculateEloChange({
        winnerElo: 1400,
        loserElo: 1000,
        kFactor: 32
      });

      expect(result.winnerChange).toBeLessThan(10);
      expect(result.loserChange).toBeGreaterThan(-10);
    });

    it('should give moderate points for evenly matched players', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1220,
        kFactor: 32
      });

      expect(Math.abs(result.winnerChange)).toBeGreaterThan(10);
      expect(Math.abs(result.winnerChange)).toBeLessThan(20);
      expect(result.winnerChange).toBe(-result.loserChange);
    });

    it('should apply +10/-10 shutout bonus for 5-0 victories', () => {
      const withBonus = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        kFactor: 32,
        winnerScore: 5,
        loserScore: 0
      });

      const withoutBonus = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        kFactor: 32,
        winnerScore: 5,
        loserScore: 3
      });

      expect(withBonus.shutoutBonus).toBe(10);
      expect(withoutBonus.shutoutBonus).toBeUndefined();
      expect(withBonus.winnerChange).toBe(withoutBonus.winnerChange + 10);
      expect(withBonus.loserChange).toBe(withoutBonus.loserChange - 10);
    });

    it('should not apply shutout bonus for close games', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        kFactor: 32,
        winnerScore: 5,
        loserScore: 4
      });

      expect(result.shutoutBonus).toBeUndefined();
    });
  });

  describe('predictMatchOutcome', () => {
    it('should predict high win probability for stronger player', () => {
      const prediction = predictMatchOutcome(1400, 1000);

      expect(prediction.player1WinProbability).toBeGreaterThan(0.9);
      expect(prediction.player2WinProbability).toBeLessThan(0.1);
    });

    it('should predict 50/50 for equal ratings', () => {
      const prediction = predictMatchOutcome(1200, 1200);

      expect(prediction.player1WinProbability).toBeCloseTo(0.5, 1);
      expect(prediction.player2WinProbability).toBeCloseTo(0.5, 1);
    });

    it('should have probabilities sum to 1', () => {
      const prediction = predictMatchOutcome(1300, 1250);

      expect(
        prediction.player1WinProbability + prediction.player2WinProbability
      ).toBeCloseTo(1);
    });
  });
});
