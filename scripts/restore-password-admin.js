#!/usr/bin/env node

/**
 * Restore the shared office password using Firebase Admin SDK
 * This bypasses security rules
 */

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'table-tennis-tracker-edd77',
  });
}

const db = admin.firestore();

async function restorePassword(password) {
  console.log('🔐 Restoring shared office password...\n');

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Store in Firestore
    await db.collection('config').doc('shared').set({
      passwordHash,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Shared office password restored successfully!');
    console.log('✅ Password: kipisthebest');
    console.log('✅ Users can now sign up and sign in.\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Password from command line
const password = process.argv[2] || 'kipisthebest';
restorePassword(password);
