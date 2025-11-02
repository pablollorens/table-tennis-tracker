#!/usr/bin/env node

/**
 * DANGER: This script will DELETE ALL DATA from the database!
 *
 * Use this to clean up test data before going live.
 *
 * This will delete:
 * - All players
 * - All matches
 * - All sessions
 * - All player avatars from Storage
 *
 * Config document is preserved (shared password and settings)
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'table-tennis-tracker-edd77',
    storageBucket: 'table-tennis-tracker-edd77.firebasestorage.app',
  });
}

const db = admin.firestore();
const storage = admin.storage();

async function deleteCollection(collectionName) {
  const batchSize = 100;
  let deleted = 0;

  const query = db.collection(collectionName).limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });

  async function deleteQueryBatch(query, resolve, reject) {
    try {
      const snapshot = await query.get();

      if (snapshot.size === 0) {
        console.log(`✅ Deleted ${deleted} documents from ${collectionName}`);
        resolve(deleted);
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deleted += snapshot.size;

      console.log(`   Deleted batch of ${snapshot.size} from ${collectionName}...`);

      // Recurse on the next batch
      process.nextTick(() => {
        deleteQueryBatch(query, resolve, reject);
      });
    } catch (error) {
      reject(error);
    }
  }
}

async function deleteAllAvatars() {
  const bucket = storage.bucket();
  const [files] = await bucket.getFiles({ prefix: 'avatars/' });

  if (files.length === 0) {
    console.log('✅ No avatars to delete');
    return;
  }

  console.log(`🗑️  Deleting ${files.length} avatar files...`);

  await Promise.all(files.map(file => file.delete()));

  console.log(`✅ Deleted ${files.length} avatar files`);
}

async function main() {
  console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the database!\n');
  console.log('This will delete:');
  console.log('  - All players');
  console.log('  - All matches');
  console.log('  - All sessions');
  console.log('  - All avatars from Storage');
  console.log('\nConfig document (shared password) will be preserved.\n');

  // Wait 3 seconds to allow cancellation
  console.log('Starting in 3 seconds... Press Ctrl+C to cancel');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log('\n🗑️  Starting database cleanup...\n');

    // Delete collections
    console.log('📦 Deleting matches...');
    await deleteCollection('matches');

    console.log('\n📦 Deleting sessions...');
    await deleteCollection('sessions');

    console.log('\n📦 Deleting players...');
    await deleteCollection('players');

    // Delete avatars from Storage
    console.log('\n📦 Deleting avatars...');
    await deleteAllAvatars();

    console.log('\n✅ Database cleanup complete!');
    console.log('✅ All test data has been deleted.');
    console.log('✅ Config document preserved (shared password is safe).');
    console.log('\nYou can now go live with a clean database! 🚀\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
