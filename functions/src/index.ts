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
    secrets: ["CLEANUP_SECRET"],
    invoker: "public",
    timeoutSeconds: 300, // 5 minutes timeout
    memory: "512MiB", // More memory for faster execution
  },
  async (req, res) => {
    // Simple authentication using secret
    const secret = req.headers.authorization?.replace("Bearer ", "") ||
                   req.query.secret as string;

    const expectedSecret = process.env.CLEANUP_SECRET;

    logger.info(`Cleanup request received. Has secret: ${!!secret}, Expected configured: ${!!expectedSecret}`);

    if (!expectedSecret || secret !== expectedSecret) {
      logger.warn("Unauthorized cleanup attempt");
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    // Respond immediately with 202 Accepted to avoid timeout issues
    res.status(202).json({
      success: true,
      message: "Cleanup job started",
      timestamp: new Date().toISOString(),
    });

    // Continue processing in background
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
    } catch (error) {
      logger.error("Error during cleanup:", error);
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

/**
 * HTTP-triggered Cloud Function to send daily match notifications.
 *
 * Triggered by GitHub Actions daily at 12:40 Amsterdam time.
 *
 * Authentication: Checks for NOTIFICATION_SECRET in request header.
 *
 * Sends FCM push notifications to all users with notificationEnabled=true.
 */
export const sendDailyNotification = onRequest(
  {
    region: "us-central1",
    cors: true,
    secrets: ["NOTIFICATION_SECRET"],
    invoker: "public",
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (req, res) => {
    // Authentication
    const secret = req.headers.authorization?.replace("Bearer ", "") ||
                   req.query.secret as string;
    const expectedSecret = process.env.NOTIFICATION_SECRET;

    logger.info(`Notification request received. Has secret: ${!!secret}`);

    if (!expectedSecret || secret !== expectedSecret) {
      logger.warn("Unauthorized notification request");
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    try {
      logger.info("Starting daily notification send...");

      // Query users with notifications enabled and valid FCM token
      const usersSnapshot = await db
        .collection("players")
        .where("notificationEnabled", "==", true)
        .get();

      if (usersSnapshot.empty) {
        logger.info("No users opted in for notifications");
        res.status(200).json({
          success: true,
          sent: 0,
          failed: 0,
          cleaned: 0,
          message: "No users opted in",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Extract FCM tokens
      const tokensWithUsers: Array<{token: string; userId: string}> = [];
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.fcmToken) {
          tokensWithUsers.push({
            token: data.fcmToken,
            userId: doc.id,
          });
        }
      });

      if (tokensWithUsers.length === 0) {
        logger.info("No valid FCM tokens found");
        res.status(200).json({
          success: true,
          sent: 0,
          failed: 0,
          cleaned: 0,
          message: "No valid FCM tokens",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.info(`Sending notifications to ${tokensWithUsers.length} users`);

      // FCM has a limit of 500 tokens per multicast request
      const BATCH_SIZE = 500;

      // Split tokens into batches
      const batches: Array<Array<{token: string; userId: string}>> = [];
      for (let i = 0; i < tokensWithUsers.length; i += BATCH_SIZE) {
        batches.push(tokensWithUsers.slice(i, i + BATCH_SIZE));
      }

      logger.info(`Split into ${batches.length} batch(es) for FCM send`);

      // Send notifications in batches and collect all responses
      const allResponses: Array<{
        response: admin.messaging.BatchResponse;
        batch: Array<{token: string; userId: string}>;
      }> = [];

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const tokens = batch.map((t) => t.token);

        logger.info(`Sending batch ${i + 1}/${batches.length} with ${tokens.length} tokens`);

        // Build FCM message for this batch
        const message = {
          notification: {
            title: "Time for Table Tennis! 🏓",
            body: "Ready for your daily match?",
          },
          webpush: {
            fcmOptions: {
              link: "/",
            },
            notification: {
              icon: "/icon-192x192.png",
              badge: "/favicon-32x32.png",
            },
          },
          tokens: tokens,
        };

        // Send multicast message for this batch
        const response = await admin.messaging().sendEachForMulticast(message);
        allResponses.push({response, batch});

        logger.info(
          `Batch ${i + 1} - Sent: ${response.successCount}, Failed: ${response.failureCount}`
        );
      }

      // Aggregate results from all batches
      let totalSuccessCount = 0;
      let totalFailureCount = 0;

      for (const {response} of allResponses) {
        totalSuccessCount += response.successCount;
        totalFailureCount += response.failureCount;
      }

      logger.info(
        `Total - Sent: ${totalSuccessCount}, Failed: ${totalFailureCount}`
      );

      // Clean up invalid tokens from all batch responses
      let cleanedCount = 0;
      const invalidTokenPromises: Promise<FirebaseFirestore.WriteResult>[] = [];

      for (const {response, batch} of allResponses) {
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              if (
                errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered"
              ) {
                const userId = batch[idx].userId;
                logger.info(`Cleaning invalid token for user: ${userId}`);

                invalidTokenPromises.push(
                  db.collection("players").doc(userId).update({
                    fcmToken: null,
                    fcmTokenUpdatedAt: null,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  })
                );
                cleanedCount++;
              }
            }
          });
        }
      }

      await Promise.all(invalidTokenPromises);

      res.status(200).json({
        success: true,
        sent: totalSuccessCount,
        failed: totalFailureCount,
        cleaned: cleanedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error sending notifications:", error);
      res.status(500).json({
        success: false,
        error: "Notification send failed",
        timestamp: new Date().toISOString(),
      });
    }
  }
);
