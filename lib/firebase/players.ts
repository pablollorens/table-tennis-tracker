import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { PlayerInput, Player } from '@/types';

/**
 * Create a new player
 */
export async function createPlayer(playerData: PlayerInput): Promise<Player> {
  const playersRef = collection(db, 'players');

  // Generate initials for avatar
  const initials = playerData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const newPlayer = {
    name: playerData.name,
    nickname: playerData.nickname || null,
    email: playerData.email || null,
    avatar: playerData.avatar || initials,
    eloRating: 1200, // Default starting ELO
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      highestElo: 1200,
      lowestElo: 1200,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(playersRef, newPlayer);

  return {
    id: docRef.id,
    ...newPlayer,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  } as Player;
}

/**
 * Get player data by ID
 */
export async function getPlayerData(playerId: string): Promise<Player> {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    throw new Error(`Player not found: ${playerId}`);
  }

  return {
    id: playerSnap.id,
    ...playerSnap.data()
  } as Player;
}

/**
 * Update player statistics after a match
 */
export async function updatePlayerStats(
  playerId: string,
  matchResult: 'win' | 'loss',
  eloChange: number
): Promise<void> {
  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    throw new Error(`Player not found: ${playerId}`);
  }

  const player = playerSnap.data() as Player;
  const newElo = player.eloRating + eloChange;
  const newTotalMatches = player.stats.totalMatches + 1;
  const newWins = matchResult === 'win' ? player.stats.wins + 1 : player.stats.wins;
  const newLosses = matchResult === 'loss' ? player.stats.losses + 1 : player.stats.losses;
  const newWinRate = newWins / newTotalMatches;

  // Calculate new streak
  let newStreak = player.stats.currentStreak;
  if (matchResult === 'win') {
    newStreak = newStreak >= 0 ? newStreak + 1 : 1;
  } else {
    newStreak = newStreak <= 0 ? newStreak - 1 : -1;
  }

  const updates = {
    eloRating: newElo,
    'stats.totalMatches': newTotalMatches,
    'stats.wins': newWins,
    'stats.losses': newLosses,
    'stats.winRate': newWinRate,
    'stats.highestElo': Math.max(player.stats.highestElo, newElo),
    'stats.lowestElo': Math.min(player.stats.lowestElo, newElo),
    'stats.currentStreak': newStreak,
    'stats.longestWinStreak': matchResult === 'win'
      ? Math.max(player.stats.longestWinStreak, Math.abs(newStreak))
      : player.stats.longestWinStreak,
    'stats.longestLoseStreak': matchResult === 'loss'
      ? Math.max(player.stats.longestLoseStreak, Math.abs(newStreak))
      : player.stats.longestLoseStreak,
    updatedAt: serverTimestamp()
  };

  await updateDoc(playerRef, updates);
}
