#!/usr/bin/env node
/**
 * Seed Historical Match Data
 *
 * Creates realistic match history for the past week with proper data format.
 * Uses the current match data structure with nested player objects.
 *
 * Usage:
 *   node scripts/seed-history.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');
const { format, subDays, startOfDay, addHours } = require('date-fns');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ELO calculation function
function calculateElo(winnerElo, loserElo, kFactor = 32) {
  const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLose = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

  const winnerChange = Math.round(kFactor * (1 - expectedWin));
  const loserChange = Math.round(kFactor * (0 - expectedLose));

  return {
    winnerNewElo: winnerElo + winnerChange,
    loserNewElo: loserElo + loserChange,
    winnerChange,
    loserChange,
    expectedWinProbability: expectedWin
  };
}

// Generate random score (winner gets 11, loser gets 0-10)
function generateScore() {
  const loserScore = Math.floor(Math.random() * 11); // 0-10
  return {
    winnerScore: 11,
    loserScore
  };
}

async function getPlayers() {
  const playersSnapshot = await collection(db, 'players');
  const playersRef = await getDocs(playersSnapshot);
  return playersRef.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function seedHistory() {
  console.log('Starting historical data seeding...\n');

  // Fetch all active players
  const { getDocs, query, where } = require('firebase/firestore');
  const playersRef = collection(db, 'players');
  const q = query(playersRef, where('isActive', '==', true));
  const playersSnapshot = await getDocs(q);

  const players = playersSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    eloRating: doc.data().eloRating
  }));

  if (players.length < 2) {
    console.error('Error: Need at least 2 active players to seed match history');
    process.exit(1);
  }

  console.log(`Found ${players.length} active players:`, players.map(p => p.name).join(', '));
  console.log('');

  // Track ELO ratings through history
  const playerElos = {};
  players.forEach(p => {
    playerElos[p.id] = p.eloRating;
  });

  const today = new Date();
  const daysToSeed = 7; // Last 7 days including today

  let totalMatches = 0;

  for (let dayOffset = daysToSeed - 1; dayOffset >= 0; dayOffset--) {
    const date = subDays(today, dayOffset);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayStart = startOfDay(date);

    // Generate 3-6 matches per day
    const matchCount = 3 + Math.floor(Math.random() * 4);

    console.log(`${dateStr}: Creating ${matchCount} matches`);

    // Create session document
    const sessionRef = doc(db, 'sessions', dateStr);
    const sessionData = {
      date: dateStr,
      players: players.map(p => p.id),
      totalMatches: matchCount,
      completedMatches: matchCount,
      pendingMatches: 0,
      createdAt: Timestamp.fromDate(dayStart),
      updatedAt: Timestamp.fromDate(addHours(dayStart, 2))
    };

    await setDoc(sessionRef, sessionData);

    // Create matches for this day
    for (let i = 0; i < matchCount; i++) {
      // Pick two random players
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      const player1 = shuffled[0];
      const player2 = shuffled[1];

      // Randomly decide winner (with slight bias toward higher ELO)
      const p1Elo = playerElos[player1.id];
      const p2Elo = playerElos[player2.id];
      const expectedP1Win = 1 / (1 + Math.pow(10, (p2Elo - p1Elo) / 400));
      const player1Wins = Math.random() < expectedP1Win;

      const winner = player1Wins ? player1 : player2;
      const loser = player1Wins ? player2 : player1;
      const winnerEloBefore = playerElos[winner.id];
      const loserEloBefore = playerElos[loser.id];

      // Calculate ELO changes
      const eloResult = calculateElo(winnerEloBefore, loserEloBefore, 32);

      // Update tracked ELO ratings
      playerElos[winner.id] = eloResult.winnerNewElo;
      playerElos[loser.id] = eloResult.loserNewElo;

      // Generate scores
      const { winnerScore, loserScore } = generateScore();

      // Create match timestamp (spread throughout the day)
      const matchTime = addHours(dayStart, 10 + (i * 0.5)); // Start at 10am, 30min apart
      const matchTimestamp = Timestamp.fromDate(matchTime);

      // Build match data with correct format
      const matchData = {
        sessionDate: dateStr,
        player1: {
          id: player1.id,
          name: player1.name,
          score: player1Wins ? winnerScore : loserScore,
          eloBefore: p1Elo,
          eloAfter: player1Wins ? eloResult.winnerNewElo : eloResult.loserNewElo,
          eloChange: player1Wins ? eloResult.winnerChange : eloResult.loserChange
        },
        player2: {
          id: player2.id,
          name: player2.name,
          score: player1Wins ? loserScore : winnerScore,
          eloBefore: p2Elo,
          eloAfter: player1Wins ? eloResult.loserNewElo : eloResult.winnerNewElo,
          eloChange: player1Wins ? eloResult.loserChange : eloResult.winnerChange
        },
        winnerId: winner.id,
        status: 'completed',
        playedAt: matchTimestamp,
        createdAt: matchTimestamp,
        updatedAt: matchTimestamp
      };

      // Save match
      const matchRef = doc(collection(db, `sessions/${dateStr}/matches`));
      await setDoc(matchRef, matchData);

      console.log(`  Match ${i + 1}: ${player1.name} ${matchData.player1.score}-${matchData.player2.score} ${player2.name} (${player1Wins ? player1.name : player2.name} wins)`);
      totalMatches++;
    }

    console.log('');
  }

  console.log(`✅ Successfully seeded ${totalMatches} matches across ${daysToSeed} days`);
  console.log('\nFinal ELO ratings after simulation:');
  players.forEach(player => {
    const change = playerElos[player.id] - player.eloRating;
    const changeStr = change >= 0 ? `+${change}` : change;
    console.log(`  ${player.name}: ${player.eloRating} → ${playerElos[player.id]} (${changeStr})`);
  });
  console.log('\nNote: Player ELO ratings in database were NOT updated.');
  console.log('These matches are historical simulations only.');

  process.exit(0);
}

seedHistory().catch(error => {
  console.error('Error seeding history:', error);
  process.exit(1);
});
