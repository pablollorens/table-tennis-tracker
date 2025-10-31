import bcrypt from 'bcryptjs';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

const APP_PASSWORD_KEY = 'pingpong_auth';

/**
 * Verify password against stored hash in Firestore
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const storedHash = await getPasswordHashFromFirestore();
    return bcrypt.compare(password, storedHash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Save authentication session to localStorage
 */
export function saveSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_PASSWORD_KEY, 'authenticated');
  }
}

/**
 * Check if user has active session
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(APP_PASSWORD_KEY) === 'authenticated';
}

/**
 * Clear authentication session
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(APP_PASSWORD_KEY);
  }
}

/**
 * Get password hash from Firestore config
 */
async function getPasswordHashFromFirestore(): Promise<string> {
  const configRef = doc(db, 'config', 'app');
  const configSnap = await getDoc(configRef);

  if (!configSnap.exists()) {
    throw new Error('App configuration not found');
  }

  return configSnap.data()?.passwordHash || '';
}

/**
 * Admin function to update password (for initial setup)
 * Only use this once to set the initial password hash in Firestore
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
