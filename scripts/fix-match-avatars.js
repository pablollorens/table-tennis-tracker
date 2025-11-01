/**
 * Fix existing matches to include player avatar fields
 * This script adds the avatar field to all existing match documents
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(process.cwd(), 'serviceAccountKey.json'));
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixMatchAvatars() {
  console.log('Starting to fix match avatars...\n');

  try {
    // Get all sessions
    const sessionsSnapshot = await db.collection('sessions').get();

    if (sessionsSnapshot.empty) {
      console.log('No sessions found.');
      return;
    }

    console.log(`Found ${sessionsSnapshot.size} sessions\n`);

    let totalMatches = 0;
    let updatedMatches = 0;

    // Process each session
    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionDate = sessionDoc.id;
      console.log(`Processing session: ${sessionDate}`);

      // Get all matches for this session
      const matchesSnapshot = await db.collection(`sessions/${sessionDate}/matches`).get();

      if (matchesSnapshot.empty) {
        console.log(`  No matches found for ${sessionDate}`);
        continue;
      }

      totalMatches += matchesSnapshot.size;
      console.log(`  Found ${matchesSnapshot.size} matches`);

      // Get all unique player IDs from matches
      const playerIds = new Set();
      matchesSnapshot.docs.forEach(doc => {
        const match = doc.data();
        playerIds.add(match.player1.id);
        playerIds.add(match.player2.id);
      });

      // Fetch player data for all players
      const playerMap = new Map();
      for (const playerId of playerIds) {
        const playerDoc = await db.collection('players').doc(playerId).get();
        if (playerDoc.exists) {
          const playerData = playerDoc.data();
          playerMap.set(playerId, {
            id: playerDoc.id,
            avatar: playerData.avatar || ''
          });
        } else {
          console.log(`  Warning: Player ${playerId} not found`);
          playerMap.set(playerId, { id: playerId, avatar: '' });
        }
      }

      // Update each match with avatar data
      const batch = db.batch();
      let batchCount = 0;

      for (const matchDoc of matchesSnapshot.docs) {
        const match = matchDoc.data();
        const player1Data = playerMap.get(match.player1.id);
        const player2Data = playerMap.get(match.player2.id);

        // Check if avatars are missing
        if (!match.player1.avatar || !match.player2.avatar) {
          batch.update(matchDoc.ref, {
            'player1.avatar': player1Data?.avatar || '',
            'player2.avatar': player2Data?.avatar || '',
          });
          batchCount++;
          updatedMatches++;
        }
      }

      // Commit batch if there are updates
      if (batchCount > 0) {
        await batch.commit();
        console.log(`  Updated ${batchCount} matches in ${sessionDate}`);
      } else {
        console.log(`  All matches already have avatars in ${sessionDate}`);
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`Total matches processed: ${totalMatches}`);
    console.log(`Matches updated: ${updatedMatches}`);

  } catch (error) {
    console.error('Error fixing match avatars:', error);
    throw error;
  }
}

// Run the script
fixMatchAvatars()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
