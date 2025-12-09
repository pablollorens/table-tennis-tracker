import { EloCalculationResult, EloCalculationParams } from '@/types';

/**
 * Calculate ELO rating changes after a match
 * Based on standard ELO formula: R_new = R_old + K * (S - E)
 * where S is actual score (1 for win, 0 for loss)
 * and E is expected score based on rating difference
 */
export function calculateEloChange({
  winnerElo,
  loserElo,
  kFactor = 32,
  winnerScore,
  loserScore
}: EloCalculationParams): EloCalculationResult {
  // Calculate expected win probability for each player
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  // Calculate base ELO changes (winner gets S=1, loser gets S=0)
  const baseWinnerChange = Math.round(kFactor * (1 - expectedWinner));
  const baseLoserChange = Math.round(kFactor * (0 - expectedLoser));

  // Check for shutout bonus (5-0): +50% of base change for both winner and loser
  const isShutout = winnerScore === 5 && loserScore === 0;
  const shutoutBonus = isShutout ? Math.round(Math.abs(baseWinnerChange) * 0.5) : undefined;

  // Apply bonus if shutout
  const winnerChange = baseWinnerChange + (shutoutBonus || 0);
  const loserChange = baseLoserChange - (shutoutBonus || 0);

  // Calculate new ratings
  const winnerNewElo = Math.round(winnerElo + winnerChange);
  const loserNewElo = Math.round(loserElo + loserChange);

  return {
    winnerNewElo,
    loserNewElo,
    winnerChange,
    loserChange,
    expectedWinProbability: expectedWinner,
    shutoutBonus
  };
}

/**
 * Predict match outcome between two players
 */
export function predictMatchOutcome(player1Elo: number, player2Elo: number): {
  player1WinProbability: number;
  player2WinProbability: number;
  expectedPointsGain: number;
} {
  const player1WinProb = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
  const player2WinProb = 1 - player1WinProb;

  // Expected points if player1 wins
  const expectedPoints = Math.round(32 * (1 - player1WinProb));

  return {
    player1WinProbability: Math.round(player1WinProb * 100) / 100,
    player2WinProbability: Math.round(player2WinProb * 100) / 100,
    expectedPointsGain: expectedPoints
  };
}

/**
 * Get description of ELO change magnitude
 */
export function getEloChangeDescription(change: number): string {
  const absChange = Math.abs(change);

  if (absChange >= 30) return 'Cambio masivo';
  if (absChange >= 20) return 'Cambio grande';
  if (absChange >= 10) return 'Cambio moderado';
  if (absChange >= 5) return 'Cambio pequeño';
  return 'Cambio mínimo';
}

/**
 * Get Tailwind color class for ELO change
 */
export function getEloChangeColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}
