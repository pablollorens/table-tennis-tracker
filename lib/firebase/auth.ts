import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './config';
import bcrypt from 'bcryptjs';
import { Player } from '@/types';

/**
 * Verify the shared office password
 */
export async function verifySharedPassword(password: string): Promise<boolean> {
  try {
    const configRef = collection(db, 'config');
    const configSnapshot = await getDocs(configRef);

    if (configSnapshot.empty) {
      throw new Error('Config document not found');
    }

    const configDoc = configSnapshot.docs[0];
    const sharedPasswordHash = configDoc.data().sharedPasswordHash || configDoc.data().passwordHash;

    return await bcrypt.compare(password, sharedPasswordHash);
  } catch (error) {
    console.error('Error verifying shared password:', error);
    return false;
  }
}

/**
 * Check if a nickname is available (case-insensitive)
 */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  try {
    const nicknameQuery = query(
      collection(db, 'players'),
      where('nickname', '==', nickname.toLowerCase())
    );
    const snapshot = await getDocs(nicknameQuery);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking nickname availability:', error);
    return false;
  }
}

/**
 * Authenticate a player by nickname and password
 */
export async function authenticatePlayer(
  nickname: string,
  password: string
): Promise<Player | null> {
  try {
    const playerQuery = query(
      collection(db, 'players'),
      where('nickname', '==', nickname.toLowerCase()),
      limit(1)
    );
    const snapshot = await getDocs(playerQuery);

    if (snapshot.empty) {
      return null;
    }

    const playerDoc = snapshot.docs[0];
    const player = { id: playerDoc.id, ...playerDoc.data() } as Player;

    const passwordMatch = await bcrypt.compare(password, player.passwordHash);

    return passwordMatch ? player : null;
  } catch (error) {
    console.error('Error authenticating player:', error);
    return null;
  }
}

interface AuthState {
  authenticated: boolean;
  playerId?: string;
  nickname?: string;
}

/**
 * Save auth state to localStorage
 */
export function saveAuthState(playerId: string, nickname: string): void {
  if (typeof window === 'undefined') return;

  const authState: AuthState = {
    authenticated: true,
    playerId,
    nickname
  };
  localStorage.setItem('auth', JSON.stringify(authState));
}

/**
 * Get auth state from localStorage
 */
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { authenticated: false };
  }

  const stored = localStorage.getItem('auth');
  if (!stored) {
    return { authenticated: false };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { authenticated: false };
  }
}

/**
 * Clear auth state
 */
export function clearAuthState(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthState().authenticated;
}
