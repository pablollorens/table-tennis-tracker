import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

/**
 * HTTP-triggered Cloud Function to clean up inactive players older than 3 days.
 *
 * Triggered by GitHub Actions daily or by Vercel deployment.
 *
 * Authentication: Checks for CLEANUP_SECRET in request header or query param.
 *
 * Deletes:
 * - Player Firestore document
 * - Player avatar files from Storage
 *
 * Preserves:
 * - Match history (by design, matches keep denormalized player data)
 */
export const cleanupInactiveUsers = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  async (req, res) => {
    // Simple authentication using secret
    const secret = req.headers.authorization?.replace("Bearer ", "") ||
                   req.query.secret as string;

    const expectedSecret = process.env.CLEANUP_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      logger.warn("Unauthorized cleanup attempt");
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    try {
      logger.info("Starting cleanup of inactive users...");

      // Calculate cutoff date (3 days ago)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(threeDaysAgo);

      logger.info(`Cutoff date: ${threeDaysAgo.toISOString()}`);

      // Query for inactive players older than 3 days
      const playersSnapshot = await db
        .collection("players")
        .where("isActive", "==", false)
        .where("createdAt", "<", cutoffTimestamp)
        .get();

      if (playersSnapshot.empty) {
        logger.info("No inactive players found to delete.");
        return;
      }

      logger.info(
        `Found ${playersSnapshot.size} inactive players to delete.`
      );

      const deletePromises = playersSnapshot.docs.map(async (doc) => {
        const playerId = doc.id;
        const playerData = doc.data();

        logger.info(
          `Deleting player: ${playerId} (${playerData.nickname})`
        );

        try {
          // Delete avatar files from Storage
          await deletePlayerAvatars(playerId);

          // Delete player document from Firestore
          await doc.ref.delete();

          logger.info(
            `Successfully deleted player: ${playerId}`
          );
        } catch (error) {
          logger.error(
            `Error deleting player ${playerId}:`,
            error
          );
          throw error;
        }
      });

      await Promise.all(deletePromises);

      logger.info(
        `Cleanup complete. Deleted ${playersSnapshot.size} inactive players.`
      );

      res.status(200).json({
        success: true,
        deletedCount: playersSnapshot.size,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error during cleanup:", error);
      res.status(500).json({
        success: false,
        error: "Cleanup failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

/**
 * Helper function to delete all avatar files for a player
 * from Firebase Storage.
 *
 * @param playerId - The ID of the player whose avatars should be deleted
 */
async function deletePlayerAvatars(playerId: string): Promise<void> {
  try {
    const bucket = storage.bucket();
    const avatarPrefix = `avatars/${playerId}/`;

    // List all files in the player's avatar folder
    const [files] = await bucket.getFiles({
      prefix: avatarPrefix,
    });

    if (files.length === 0) {
      logger.info(
        `No avatar files found for player: ${playerId}`
      );
      return;
    }

    logger.info(
      `Deleting ${files.length} avatar file(s) for player: ${playerId}`
    );

    // Delete all avatar files
    const deleteFilePromises = files.map((file) => file.delete());
    await Promise.all(deleteFilePromises);

    logger.info(
      `Successfully deleted avatar files for player: ${playerId}`
    );
  } catch (error) {
    logger.error(
      `Error deleting avatars for player ${playerId}:`,
      error
    );
    throw error;
  }
}
