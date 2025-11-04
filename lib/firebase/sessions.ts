import {
  doc,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  increment,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import { getPlayerData } from './players';
import { generateRoundRobin } from '@/lib/utils/round-robin';
import { trackRoundRobinGenerated } from './analytics';
import { format } from 'date-fns';

/**
 * Check if a pending match already exists for the given player pair
 */
async function hasDuplicatePendingMatch(
  sessionDate: string,
  player1Id: string,
  player2Id: string
): Promise<boolean> {
  const matchesRef = collection(db, `sessions/${sessionDate}/matches`);
  const q = query(matchesRef, where('status', '==', 'pending'));

  const snapshot = await getDocs(q);

  // Check if any pending match has the same player combination (bidirectional)
  return snapshot.docs.some(doc => {
    const match = doc.data();
    const matchPlayer1Id = match.player1.id;
    const matchPlayer2Id = match.player2.id;

    // Check both directions: A vs B or B vs A
    return (
      (matchPlayer1Id === player1Id && matchPlayer2Id === player2Id) ||
      (matchPlayer1Id === player2Id && matchPlayer2Id === player1Id)
    );
  });
}

/**
 * Create a daily session with all round-robin matches
 */
export async function createDailySession(playerIds: string[]): Promise<void> {
  if (playerIds.length < 2) {
    throw new Error('At least 2 players are required to create a session');
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Generate all match pairings
  const matchPairings = generateRoundRobin(playerIds);

  // Check for duplicate pending matches (in case session already partially exists)
  const duplicateChecks = await Promise.all(
    matchPairings.map(pairing =>
      hasDuplicatePendingMatch(today, pairing.player1Id, pairing.player2Id)
    )
  );

  const duplicates = matchPairings.filter((_, index) => duplicateChecks[index]);

  if (duplicates.length > 0) {
    // Fetch player data to show meaningful error messages
    const allPlayerIds = [...new Set([...playerIds])];
    const playerDataPromises = allPlayerIds.map(id => getPlayerData(id));
    const playersData = await Promise.all(playerDataPromises);
    const playerMap = new Map(playersData.map(p => [p.id, p]));

    const duplicateMessages = duplicates.map(dup => {
      const p1 = playerMap.get(dup.player1Id);
      const p2 = playerMap.get(dup.player2Id);
      return `${p1?.name || 'Unknown'} vs ${p2?.name || 'Unknown'}`;
    }).join(', ');

    throw new Error(`Pending matches already exist for: ${duplicateMessages}`);
  }

  const batch = writeBatch(db);

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
        avatar: player1.avatar || '',
        score: null,
        eloBefore: player1.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: player2.id,
        name: player2.name,
        avatar: player2.avatar || '',
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

  // Generate all match pairings
  const matchPairings = generateRoundRobin(playerIds);

  // Check for duplicate pending matches
  const duplicateChecks = await Promise.all(
    matchPairings.map(pairing =>
      hasDuplicatePendingMatch(today, pairing.player1Id, pairing.player2Id)
    )
  );

  const duplicates = matchPairings.filter((_, index) => duplicateChecks[index]);

  if (duplicates.length > 0) {
    // Fetch player data to show meaningful error messages
    const allPlayerIds = [...new Set([...playerIds])];
    const playerDataPromises = allPlayerIds.map(id => getPlayerData(id));
    const playersData = await Promise.all(playerDataPromises);
    const playerMap = new Map(playersData.map(p => [p.id, p]));

    const duplicateMessages = duplicates.map(dup => {
      const p1 = playerMap.get(dup.player1Id);
      const p2 = playerMap.get(dup.player2Id);
      return `${p1?.name || 'Unknown'} vs ${p2?.name || 'Unknown'}`;
    }).join(', ');

    throw new Error(`Pending matches already exist for: ${duplicateMessages}`);
  }

  const batch = writeBatch(db);

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
        avatar: player1.avatar || '',
        score: null,
        eloBefore: player1.eloRating,
        eloAfter: null,
        eloChange: null,
      },
      player2: {
        id: player2.id,
        name: player2.name,
        avatar: player2.avatar || '',
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

/**
 * Get all session dates that have completed matches for a given month
 */
export async function getSessionsByMonth(yearMonth: string): Promise<string[]> {
  // yearMonth format: "2025-10"
  const startDate = `${yearMonth}-01`;
  const endDate = `${yearMonth}-31`;

  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    where('completedMatches', '>', 0)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data().date as string);
}
