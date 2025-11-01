#!/usr/bin/env node
/**
 * Cleanup Matches Script
 *
 * Usage:
 *   node scripts/cleanup-matches.js all              # Delete all sessions and matches
 *   node scripts/cleanup-matches.js date 2025-10-25  # Delete specific date
 *   node scripts/cleanup-matches.js range 2025-10-01 2025-10-31  # Delete date range
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch, query, where } = require('firebase/firestore');
const { format } = require('date-fns');
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

async function deleteSessionAndMatches(sessionDate) {
  console.log(`Deleting session: ${sessionDate}`);

  try {
    // Delete all matches in the session
    const matchesRef = collection(db, `sessions/${sessionDate}/matches`);
    const matchesSnapshot = await getDocs(matchesRef);

    let matchCount = 0;
    const batch = writeBatch(db);

    matchesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      matchCount++;
    });

    await batch.commit();

    // Delete the session document
    const sessionRef = doc(db, 'sessions', sessionDate);
    await deleteDoc(sessionRef);

    console.log(`  ✓ Deleted session ${sessionDate} (${matchCount} matches)`);
    return { date: sessionDate, matches: matchCount };
  } catch (error) {
    console.error(`  ✗ Error deleting session ${sessionDate}:`, error.message);
    return null;
  }
}

async function cleanupAll() {
  console.log('Fetching all sessions...\n');

  const sessionsRef = collection(db, 'sessions');
  const snapshot = await getDocs(sessionsRef);

  if (snapshot.empty) {
    console.log('No sessions found.');
    return;
  }

  console.log(`Found ${snapshot.size} sessions. Deleting...\n`);

  const results = [];
  for (const docSnapshot of snapshot.docs) {
    const result = await deleteSessionAndMatches(docSnapshot.id);
    if (result) results.push(result);
  }

  console.log(`\n✓ Deleted ${results.length} sessions and ${results.reduce((sum, r) => sum + r.matches, 0)} matches total`);
}

async function cleanupDate(dateString) {
  console.log(`Cleaning up date: ${dateString}\n`);

  const result = await deleteSessionAndMatches(dateString);

  if (result) {
    console.log(`\n✓ Successfully deleted session`);
  } else {
    console.log(`\n✗ Session not found or error occurred`);
  }
}

async function cleanupRange(startDate, endDate) {
  console.log(`Fetching sessions between ${startDate} and ${endDate}...\n`);

  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log('No sessions found in this range.');
    return;
  }

  console.log(`Found ${snapshot.size} sessions. Deleting...\n`);

  const results = [];
  for (const docSnapshot of snapshot.docs) {
    const result = await deleteSessionAndMatches(docSnapshot.id);
    if (result) results.push(result);
  }

  console.log(`\n✓ Deleted ${results.length} sessions and ${results.reduce((sum, r) => sum + r.matches, 0)} matches total`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Cleanup Matches Script

Usage:
  node scripts/cleanup-matches.js all                           # Delete all sessions and matches
  node scripts/cleanup-matches.js date 2025-10-25               # Delete specific date
  node scripts/cleanup-matches.js range 2025-10-01 2025-10-31   # Delete date range

Examples:
  node scripts/cleanup-matches.js all
  node scripts/cleanup-matches.js date ${format(new Date(), 'yyyy-MM-dd')}
  node scripts/cleanup-matches.js range 2025-10-01 2025-10-31
    `);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'all':
        await cleanupAll();
        break;

      case 'date':
        if (args.length < 2) {
          console.error('Error: Please provide a date (YYYY-MM-DD)');
          process.exit(1);
        }
        await cleanupDate(args[1]);
        break;

      case 'range':
        if (args.length < 3) {
          console.error('Error: Please provide start and end dates (YYYY-MM-DD)');
          process.exit(1);
        }
        await cleanupRange(args[1], args[2]);
        break;

      default:
        console.error(`Error: Unknown command "${command}"`);
        console.log('Valid commands: all, date, range');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
