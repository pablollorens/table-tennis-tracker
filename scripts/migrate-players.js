const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const bcrypt = require('bcryptjs');
require('dotenv/config');

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generate a nickname from a player's name
 * Removes spaces, converts to lowercase
 */
function generateNickname(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[^a-z0-9]/g, ''); // Remove special characters
}

async function migratePlayers() {
  console.log('🔄 Starting player migration...\n');

  // Get all players
  const playersSnapshot = await getDocs(collection(db, 'players'));

  if (playersSnapshot.empty) {
    console.log('ℹ️  No players found in the database.');
    process.exit(0);
  }

  const players = playersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log(`📊 Found ${players.length} player(s) in the database.\n`);

  // Check which players need migration
  const playersToMigrate = players.filter(player =>
    !player.nickname || !player.passwordHash || player.isActive === undefined
  );

  if (playersToMigrate.length === 0) {
    console.log('✅ All players are already migrated. No action needed.');
    process.exit(0);
  }

  console.log(`🔧 Found ${playersToMigrate.length} player(s) that need migration:\n`);

  const defaultPassword = 'changeme123'; // Default password for migrated users
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const nicknameMap = new Map(); // Track used nicknames to avoid duplicates

  for (const player of playersToMigrate) {
    try {
      console.log(`  Migrating: ${player.name || player.id}`);

      // Generate nickname
      let nickname = player.nickname || generateNickname(player.name || player.id);

      // Handle duplicate nicknames by appending numbers
      let counter = 1;
      const baseNickname = nickname;
      while (nicknameMap.has(nickname) ||
             players.some(p => p.nickname === nickname && p.id !== player.id)) {
        nickname = `${baseNickname}${counter}`;
        counter++;
      }
      nicknameMap.set(nickname, true);

      // Prepare update data
      const updateData = {};

      if (!player.nickname) {
        updateData.nickname = nickname;
      }

      if (!player.passwordHash) {
        updateData.passwordHash = hashedPassword;
      }

      if (player.isActive === undefined) {
        updateData.isActive = true; // Existing players are active
      }

      // Update the player document
      await updateDoc(doc(db, 'players', player.id), updateData);

      console.log(`    ✓ Migrated with nickname: "${nickname}"`);

    } catch (error) {
      console.error(`    ✗ Error migrating ${player.name || player.id}:`, error.message);
    }
  }

  console.log('\n✅ Migration complete!\n');
  console.log('📝 Important Notes:');
  console.log(`   - Default password for all migrated users: "${defaultPassword}"`);
  console.log('   - Users should change their password after first login');
  console.log('   - All migrated players are set as active (isActive: true)');
  console.log('   - Nicknames were auto-generated from names');
  console.log('\n🔐 Security Recommendation:');
  console.log('   Notify all migrated users to:');
  console.log('   1. Log in with their nickname and default password');
  console.log('   2. Update their profile with a new password');

  process.exit(0);
}

migratePlayers().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
