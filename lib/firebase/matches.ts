import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
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

  // Determine scores for winner/loser
  const winnerScore = isPlayer1Winner ? result.player1Score : result.player2Score;
  const loserScore = isPlayer1Winner ? result.player2Score : result.player1Score;

  // Calculate ELO changes using CURRENT ratings, not stale eloBefore values
  // Includes +10/-10 shutout bonus for 5-0 victories
  const eloResult = calculateEloChange({
    winnerElo: winnerCurrentElo,
    loserElo: loserCurrentElo,
    kFactor: 32,
    winnerScore,
    loserScore
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

  // Create matchHistory document for player stats and historical tracking
  const matchHistoryRef = doc(db, 'matchHistory', matchId);
  await setDoc(matchHistoryRef, {
    sessionDate,
    player1Id: match.player1.id,
    player1Name: match.player1.name,
    player1Score: result.player1Score,
    player1EloChange: isPlayer1Winner ? eloResult.winnerChange : eloResult.loserChange,
    player2Id: match.player2.id,
    player2Name: match.player2.name,
    player2Score: result.player2Score,
    player2EloChange: isPlayer1Winner ? eloResult.loserChange : eloResult.winnerChange,
    winnerId: result.winnerId,
    winnerName: isPlayer1Winner ? match.player1.name : match.player2.name,
    playedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });

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

/**
 * Delete a pending match
 * Only allows deletion of matches with status 'pending' and no recorded result
 */
export async function deletePendingMatch(
  sessionDate: string,
  matchId: string
): Promise<void> {
  const matchRef = doc(db, `sessions/${sessionDate}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error('Match not found');
  }

  const match = matchSnap.data();

  // Validate match is pending
  if (match.status !== 'pending') {
    throw new Error('Cannot delete a match that has been completed or skipped');
  }

  // Validate match has no result
  if (match.winnerId !== null) {
    throw new Error('Cannot delete a match with a recorded result');
  }

  // Delete the match document
  await deleteDoc(matchRef);

  // Update session counters (decrease total and pending by 1)
  const sessionRef = doc(db, 'sessions', sessionDate);
  const sessionSnap = await getDoc(sessionRef);

  if (sessionSnap.exists()) {
    const session = sessionSnap.data();
    await updateDoc(sessionRef, {
      totalMatches: Math.max(0, session.totalMatches - 1),
      pendingMatches: Math.max(0, session.pendingMatches - 1),
      updatedAt: serverTimestamp()
    });
  }
}
