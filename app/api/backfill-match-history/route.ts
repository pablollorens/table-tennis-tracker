import { NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST() {
  try {
    console.log('Starting matchHistory backfill...\n');

    // Get all sessions
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    console.log(`Found ${sessionsSnapshot.size} sessions\n`);

    let totalMatches = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each session
    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionDate = sessionDoc.id;
      console.log(`Processing session: ${sessionDate}`);

      // Get all completed matches in this session
      const matchesQuery = query(
        collection(db, `sessions/${sessionDate}/matches`),
        where('status', '==', 'completed')
      );
      const matchesSnapshot = await getDocs(matchesQuery);

      console.log(`  Found ${matchesSnapshot.size} completed matches`);
      totalMatches += matchesSnapshot.size;

      // Process each match
      for (const matchDoc of matchesSnapshot.docs) {
        const matchId = matchDoc.id;
        const match = matchDoc.data();

        // Check if matchHistory document already exists
        const matchHistoryRef = doc(db, 'matchHistory', matchId);
        const matchHistoryDoc = await getDoc(matchHistoryRef);

        if (matchHistoryDoc.exists()) {
          console.log(`  ✓ Match ${matchId} already exists in matchHistory, skipping`);
          skippedCount++;
          continue;
        }

        // Create matchHistory document
        try {
          await setDoc(matchHistoryRef, {
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
        } catch (error: any) {
          const errorMsg = `Error creating matchHistory for ${matchId}: ${error.message}`;
          console.error(`  ✗ ${errorMsg}`);
          errors.push(errorMsg);
          errorCount++;
        }
      }
    }

    // Summary
    const summary = {
      totalMatches,
      createdCount,
      skippedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Backfill Summary:', summary);

    return NextResponse.json({
      success: true,
      message: 'Backfill completed',
      ...summary
    });

  } catch (error: any) {
    console.error('Fatal error during backfill:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
