import {
  doc,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import { getPlayerData } from './players';
import { generateRoundRobin } from '@/lib/utils/round-robin';
import { trackRoundRobinGenerated } from './analytics';
import { format } from 'date-fns';

/**
 * Create a daily session with all round-robin matches
 */
export async function createDailySession(playerIds: string[]): Promise<void> {
  if (playerIds.length < 2) {
    throw new Error('At least 2 players are required to create a session');
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const batch = writeBatch(db);

  // Generate all match pairings
  const matchPairings = generateRoundRobin(playerIds);

  // Create session document
  const sessionRef = doc(db, 'sessions', today);
  batch.set(sessionRef, {
    date: today,
    players: playerIds,
    totalMatches: matchPairings.length,
    completedMatches: 0,
    pendingMatches: matchPairings.length,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Fetch player data for all players
  const playerDataPromises = playerIds.map(id => getPlayerData(id));
  const playersData = await Promise.all(playerDataPromises);
  const playerMap = new Map(playersData.map(p => [p.id, p]));

  // Create match documents
  for (const pairing of matchPairings) {
    const player1 = playerMap.get(pairing.player1Id);
    const player2 = playerMap.get(pairing.player2Id);

    if (!player1 || !player2) {
      throw new Error('Player data not found');
    }

    const matchRef = doc(collection(db, `sessions/${today}/matches`));
    batch.set(matchRef, {
      sessionDate: today,
      player1: {
        id: player1.id,
        name: player1.name,
        score: null,
        eloBefore: player1.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: player2.id,
        name: player2.name,
        score: null,
        eloBefore: player2.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      winnerId: null,
      status: 'pending',
      playedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Commit all changes
  await batch.commit();

  // Track analytics
  await trackRoundRobinGenerated(matchPairings.length, playerIds.length);
}

/**
 * Add more matches to an existing session
 */
export async function addMoreMatches(playerIds: string[]): Promise<void> {
  if (playerIds.length < 2) {
    throw new Error('At least 2 players are required to add matches');
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const batch = writeBatch(db);

  // Generate all match pairings
  const matchPairings = generateRoundRobin(playerIds);

  // Update session document counters
  const sessionRef = doc(db, 'sessions', today);
  batch.update(sessionRef, {
    totalMatches: increment(matchPairings.length),
    pendingMatches: increment(matchPairings.length),
    updatedAt: serverTimestamp(),
  });

  // Fetch player data for all players
  const playerDataPromises = playerIds.map(id => getPlayerData(id));
  const playersData = await Promise.all(playerDataPromises);
  const playerMap = new Map(playersData.map(p => [p.id, p]));

  // Create match documents
  for (const pairing of matchPairings) {
    const player1 = playerMap.get(pairing.player1Id);
    const player2 = playerMap.get(pairing.player2Id);

    if (!player1 || !player2) {
      throw new Error('Player data not found');
    }

    const matchRef = doc(collection(db, `sessions/${today}/matches`));
    batch.set(matchRef, {
      sessionDate: today,
      player1: {
        id: player1.id,
        name: player1.name,
        score: null,
        eloBefore: player1.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: player2.id,
        name: player2.name,
        score: null,
        eloBefore: player2.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      winnerId: null,
      status: 'pending',
      playedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Commit all changes
  await batch.commit();

  // Track analytics
  await trackRoundRobinGenerated(matchPairings.length, playerIds.length);
}

/**
 * Update session match counters
 */
export async function updateSessionCounters(
  sessionDate: string,
  completedChange: number
): Promise<void> {
  const sessionRef = doc(db, 'sessions', sessionDate);
  await updateDoc(sessionRef, {
    completedMatches: increment(completedChange),
    pendingMatches: increment(-completedChange),
    updatedAt: serverTimestamp()
  });
}
