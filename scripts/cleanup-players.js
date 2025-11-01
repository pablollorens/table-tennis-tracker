#!/usr/bin/env node
/**
 * Cleanup Players Script
 *
 * Usage:
 *   node scripts/cleanup-players.js all              # Delete all players
 *   node scripts/cleanup-players.js inactive         # Delete inactive players only
 *   node scripts/cleanup-players.js player <id>      # Delete specific player by ID
 *   node scripts/cleanup-players.js nickname <name>  # Delete player by nickname
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, query, where } = require('firebase/firestore');
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

async function deletePlayer(playerId, playerData) {
  const playerRef = doc(db, 'players', playerId);
  await deleteDoc(playerRef);
  console.log(`  ✓ Deleted player: ${playerData.nickname || playerData.name || playerId}`);
}

async function cleanupAll() {
  console.log('Fetching all players...\n');

  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(playersRef);

  if (snapshot.empty) {
    console.log('No players found.');
    return;
  }

  console.log(`Found ${snapshot.size} players. Deleting...\n`);

  let count = 0;
  for (const docSnapshot of snapshot.docs) {
    await deletePlayer(docSnapshot.id, docSnapshot.data());
    count++;
  }

  console.log(`\n✓ Deleted ${count} players total`);
}

async function cleanupInactive() {
  console.log('Fetching inactive players...\n');

  const playersRef = collection(db, 'players');
  const q = query(playersRef, where('isActive', '==', false));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log('No inactive players found.');
    return;
  }

  console.log(`Found ${snapshot.size} inactive players. Deleting...\n`);

  let count = 0;
  for (const docSnapshot of snapshot.docs) {
    await deletePlayer(docSnapshot.id, docSnapshot.data());
    count++;
  }

  console.log(`\n✓ Deleted ${count} inactive players`);
}

async function cleanupById(playerId) {
  console.log(`Looking for player: ${playerId}\n`);

  const playerRef = doc(db, 'players', playerId);
  const playerSnap = await getDocs(playerRef);

  if (!playerSnap.exists()) {
    console.log('Player not found.');
    return;
  }

  await deletePlayer(playerId, playerSnap.data());
  console.log(`\n✓ Successfully deleted player`);
}

async function cleanupByNickname(nickname) {
  console.log(`Looking for player with nickname: ${nickname}\n`);

  const playersRef = collection(db, 'players');
  const q = query(playersRef, where('nickname', '==', nickname.toLowerCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log('Player not found.');
    return;
  }

  if (snapshot.size > 1) {
    console.log(`Warning: Found ${snapshot.size} players with this nickname:`);
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}, Name: ${data.name || 'N/A'}, Active: ${data.isActive}`);
    });
    console.log('\nPlease use the player ID instead: node scripts/cleanup-players.js player <id>');
    return;
  }

  const docSnapshot = snapshot.docs[0];
  await deletePlayer(docSnapshot.id, docSnapshot.data());
  console.log(`\n✓ Successfully deleted player`);
}

async function listPlayers() {
  console.log('Fetching all players...\n');

  const playersRef = collection(db, 'players');
  const snapshot = await getDocs(playersRef);

  if (snapshot.empty) {
    console.log('No players found.');
    return;
  }

  console.log(`Found ${snapshot.size} players:\n`);

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Nickname: ${data.nickname || 'N/A'}`);
    console.log(`  Name: ${data.name || 'N/A'}`);
    console.log(`  ELO: ${data.eloRating}`);
    console.log(`  Active: ${data.isActive}`);
    console.log(`  Matches: ${data.stats?.totalMatches || 0}`);
    console.log('');
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Cleanup Players Script

Usage:
  node scripts/cleanup-players.js all                    # Delete all players
  node scripts/cleanup-players.js inactive               # Delete inactive players only
  node scripts/cleanup-players.js player <id>            # Delete specific player by ID
  node scripts/cleanup-players.js nickname <nickname>    # Delete player by nickname
  node scripts/cleanup-players.js list                   # List all players

Examples:
  node scripts/cleanup-players.js all
  node scripts/cleanup-players.js inactive
  node scripts/cleanup-players.js player abc123xyz
  node scripts/cleanup-players.js nickname johndoe
  node scripts/cleanup-players.js list

Warning:
  Deleting players does NOT delete their match history. Matches will still reference
  the deleted player IDs. Consider this before deleting active players with match history.
    `);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'all':
        console.log('⚠️  WARNING: This will delete ALL players!');
        console.log('Press Ctrl+C within 3 seconds to cancel...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await cleanupAll();
        break;

      case 'inactive':
        await cleanupInactive();
        break;

      case 'player':
        if (args.length < 2) {
          console.error('Error: Please provide a player ID');
          process.exit(1);
        }
        await cleanupById(args[1]);
        break;

      case 'nickname':
        if (args.length < 2) {
          console.error('Error: Please provide a nickname');
          process.exit(1);
        }
        await cleanupByNickname(args[1]);
        break;

      case 'list':
        await listPlayers();
        break;

      default:
        console.error(`Error: Unknown command "${command}"`);
        console.log('Valid commands: all, inactive, player, nickname, list');
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
