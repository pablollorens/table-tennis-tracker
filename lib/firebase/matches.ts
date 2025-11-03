import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { MatchResultInput } from '@/types';
import { calculateEloChange } from '@/lib/elo/calculator';
import { updatePlayerStats } from './players';
import { updateSessionCounters } from './sessions';

/**
 * Record the result of a match
 */
export async function recordMatchResult(
  sessionDate: string,
  matchId: string,
  result: MatchResultInput
): Promise<void> {
  const matchRef = doc(db, `sessions/${sessionDate}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Match not found');
  }

  const match = matchSnap.data();

  // Validate match is pending
  if (match.status !== 'pending') {
    throw new Error('Match has already been recorded');
  }

  // Determine winner and loser
  const isPlayer1Winner = result.winnerId === match.player1.id;
  const winnerData = isPlayer1Winner ? match.player1 : match.player2;
  const loserData = isPlayer1Winner ? match.player2 : match.player1;

  // Fetch current ELO ratings from player documents (critical for multiple matches per day)
  const winnerPlayerRef = doc(db, 'players', winnerData.id);
  const loserPlayerRef = doc(db, 'players', loserData.id);

  const [winnerPlayerSnap, loserPlayerSnap] = await Promise.all([
    getDoc(winnerPlayerRef),
    getDoc(loserPlayerRef)
  ]);

  if (!winnerPlayerSnap.exists() || !loserPlayerSnap.exists()) {
    throw new Error('Player not found');
  }

  const winnerCurrentElo = winnerPlayerSnap.data().eloRating || 1200;
  const loserCurrentElo = loserPlayerSnap.data().eloRating || 1200;

  // Calculate ELO changes using CURRENT ratings, not stale eloBefore values
  const eloResult = calculateEloChange({
    winnerElo: winnerCurrentElo,
    loserElo: loserCurrentElo,
    kFactor: 32
  });

  // Update match document with actual ELO values used
  const updates = {
    'player1.score': result.player1Score,
    'player1.eloBefore': isPlayer1Winner ? winnerCurrentElo : loserCurrentElo,
    'player1.eloAfter': isPlayer1Winner ? eloResult.winnerNewElo : eloResult.loserNewElo,
    'player1.eloChange': isPlayer1Winner ? eloResult.winnerChange : eloResult.loserChange,
    'player2.score': result.player2Score,
    'player2.eloBefore': isPlayer1Winner ? loserCurrentElo : winnerCurrentElo,
    'player2.eloAfter': isPlayer1Winner ? eloResult.loserNewElo : eloResult.winnerNewElo,
    'player2.eloChange': isPlayer1Winner ? eloResult.loserChange : eloResult.winnerChange,
    winnerId: result.winnerId,
    status: 'completed',
    playedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await updateDoc(matchRef, updates);

  // Update player statistics
  await updatePlayerStats(
    winnerData.id,
    'win',
    isPlayer1Winner ? eloResult.winnerChange : eloResult.winnerChange
  );

  await updatePlayerStats(
    loserData.id,
    'loss',
    isPlayer1Winner ? eloResult.loserChange : eloResult.loserChange
  );

  // Update session counters
  await updateSessionCounters(sessionDate, 1);
}
