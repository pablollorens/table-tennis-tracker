import { calculateWinProbability, getProbabilityLevel } from '../probability';

describe('calculateWinProbability', () => {
  it('should return 50/50 probability for equal ratings', () => {
    const result = calculateWinProbability(1200, 1200);
    expect(result.player1Probability).toBe(50);
    expect(result.player2Probability).toBe(50);
  });

  it('should favor higher-rated player with slight advantage', () => {
    const result = calculateWinProbability(1216, 1184);
    expect(result.player1Probability).toBeGreaterThan(50);
    expect(result.player2Probability).toBeLessThan(50);
    expect(result.player1Probability).toBeCloseTo(55, 0);
    expect(result.player2Probability).toBeCloseTo(45, 0);
  });

  it('should strongly favor higher-rated player with large gap', () => {
    const result = calculateWinProbability(1300, 1100);
    expect(result.player1Probability).toBeGreaterThan(70);
    expect(result.player2Probability).toBeLessThan(30);
    expect(result.player1Probability).toBeCloseTo(76, 0);
    expect(result.player2Probability).toBeCloseTo(24, 0);
  });

  it('should handle extreme rating differences', () => {
    const result = calculateWinProbability(1500, 1000);
    expect(result.player1Probability).toBeGreaterThan(90);
    expect(result.player2Probability).toBeLessThan(10);
  });

  it('should sum probabilities to approximately 100%', () => {
    const result = calculateWinProbability(1250, 1180);
    const sum = result.player1Probability + result.player2Probability;
    // Allow for rounding difference of 1-2%
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
  });

  it('should handle zero/low ratings', () => {
    const result = calculateWinProbability(100, 100);
    expect(result.player1Probability).toBe(50);
    expect(result.player2Probability).toBe(50);
  });

  it('should handle player2 having higher rating', () => {
    const result = calculateWinProbability(1184, 1216);
    expect(result.player1Probability).toBeLessThan(50);
    expect(result.player2Probability).toBeGreaterThan(50);
  });
});

describe('getProbabilityLevel', () => {
  it('should return "favorite" for probabilities > 52%', () => {
    expect(getProbabilityLevel(53)).toBe('favorite');
    expect(getProbabilityLevel(55)).toBe('favorite');
    expect(getProbabilityLevel(76)).toBe('favorite');
    expect(getProbabilityLevel(100)).toBe('favorite');
  });

  it('should return "underdog" for probabilities < 48%', () => {
    expect(getProbabilityLevel(47)).toBe('underdog');
    expect(getProbabilityLevel(45)).toBe('underdog');
    expect(getProbabilityLevel(24)).toBe('underdog');
    expect(getProbabilityLevel(0)).toBe('underdog');
  });

  it('should return "even" for probabilities between 48-52%', () => {
    expect(getProbabilityLevel(48)).toBe('even');
    expect(getProbabilityLevel(49)).toBe('even');
    expect(getProbabilityLevel(50)).toBe('even');
    expect(getProbabilityLevel(51)).toBe('even');
    expect(getProbabilityLevel(52)).toBe('even');
  });
});
