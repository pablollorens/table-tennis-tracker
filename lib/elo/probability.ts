/**
 * Win Probability Calculator
 *
 * Calculates the expected win probability for two players based on their ELO ratings.
 * Uses the standard ELO formula: P = 1 / (1 + 10^((opponent - player) / 400))
 */

export interface WinProbability {
  player1Probability: number;
  player2Probability: number;
}

/**
 * Calculate win probabilities for two players based on their current ELO ratings
 * @param player1Elo Current ELO rating of player 1
 * @param player2Elo Current ELO rating of player 2
 * @returns Object containing win probabilities for both players (as percentages 0-100)
 */
export function calculateWinProbability(
  player1Elo: number,
  player2Elo: number
): WinProbability {
  // Calculate expected win probability using standard ELO formula
  const player1Expected = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
  const player2Expected = 1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));

  // Convert to percentages and round to whole numbers
  return {
    player1Probability: Math.round(player1Expected * 100),
    player2Probability: Math.round(player2Expected * 100),
  };
}

/**
 * Determine if a player is the favorite based on win probability
 * @param probability Win probability as percentage (0-100)
 * @returns 'favorite' if > 52%, 'underdog' if < 48%, 'even' otherwise
 */
export function getProbabilityLevel(
  probability: number
): 'favorite' | 'underdog' | 'even' {
  if (probability > 52) return 'favorite';
  if (probability < 48) return 'underdog';
  return 'even';
}
