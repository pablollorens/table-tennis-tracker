/**
 * Backfill matchHistory collection from existing session matches
 *
 * Run with: node scripts/backfill-match-history.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function backfillMatchHistory() {
  console.log('Starting matchHistory backfill...\n');

  try {
    // Get all sessions
    const sessionsSnapshot = await db.collection('sessions').get();
    console.log(`Found ${sessionsSnapshot.size} sessions\n`);

    let totalMatches = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each session
    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionDate = sessionDoc.id;
      console.log(`Processing session: ${sessionDate}`);

      // Get all matches in this session
      const matchesSnapshot = await db
        .collection(`sessions/${sessionDate}/matches`)
        .where('status', '==', 'completed')
        .get();

      console.log(`  Found ${matchesSnapshot.size} completed matches`);
      totalMatches += matchesSnapshot.size;

      // Process each match
      for (const matchDoc of matchesSnapshot.docs) {
        const matchId = matchDoc.id;
        const match = matchDoc.data();

        // Check if matchHistory document already exists
        const matchHistoryRef = db.collection('matchHistory').doc(matchId);
        const matchHistoryDoc = await matchHistoryRef.get();

        if (matchHistoryDoc.exists) {
          console.log(`  ✓ Match ${matchId} already exists in matchHistory, skipping`);
          skippedCount++;
          continue;
        }

        // Create matchHistory document
        try {
          await matchHistoryRef.set({
            sessionDate: sessionDate,
            player1Id: match.player1.id,
            player1Name: match.player1.name,
            player1Score: match.player1.score || 0,
            player1EloChange: match.player1.eloChange || 0,
            player2Id: match.player2.id,
            player2Name: match.player2.name,
            player2Score: match.player2.score || 0,
            player2EloChange: match.player2.eloChange || 0,
            winnerId: match.winnerId,
            winnerName: match.winnerId === match.player1.id ? match.player1.name : match.player2.name,
            playedAt: match.playedAt || match.createdAt || Timestamp.now(),
            createdAt: match.createdAt || Timestamp.now()
          });

          console.log(`  + Created matchHistory for ${matchId}`);
          createdCount++;
        } catch (error) {
          console.error(`  ✗ Error creating matchHistory for ${matchId}:`, error.message);
          errorCount++;
        }
      }

      console.log('');
    }

    // Summary
    console.log('='.repeat(50));
    console.log('Backfill Summary:');
    console.log(`Total matches found: ${totalMatches}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Fatal error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillMatchHistory()
  .then(() => {
    console.log('\nBackfill completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nBackfill failed:', error);
    process.exit(1);
  });
