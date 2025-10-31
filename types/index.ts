import { Timestamp } from 'firebase/firestore';

// Player Types
export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  highestElo: number;
  lowestElo: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  avatar: string;
  eloRating: number;
  stats: PlayerStats;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Session Types
export interface Session {
  date: string; // YYYY-MM-DD
  players: string[];
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Match Types
export interface MatchPlayer {
  id: string;
  name: string;
  score: number | null;
  eloBefore: number;
  eloAfter: number | null;
  eloChange: number | null;
}

export type MatchStatus = 'pending' | 'completed' | 'skipped';

export interface Match {
  id: string;
  sessionDate: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string | null;
  status: MatchStatus;
  playedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Match History Types
export interface MatchHistory {
  id: string;
  sessionDate: string;
  player1Id: string;
  player1Name: string;
  player1Score: number;
  player1EloChange: number;
  player2Id: string;
  player2Name: string;
  player2Score: number;
  player2EloChange: number;
  winnerId: string;
  winnerName: string;
  playedAt: Timestamp;
  createdAt: Timestamp;
}

// Config Types
export interface AppConfig {
  passwordHash: string;
  currentSessionDate: string;
  eloKFactor: number;
  defaultEloRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form Types
export interface MatchResultInput {
  player1Score: number;
  player2Score: number;
  winnerId: string;
}

export interface PlayerInput {
  name: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

// ELO Calculation Types
export interface EloCalculationResult {
  winnerNewElo: number;
  loserNewElo: number;
  winnerChange: number;
  loserChange: number;
  expectedWinProbability: number;
}

export interface EloCalculationParams {
  winnerElo: number;
  loserElo: number;
  kFactor?: number;
}
