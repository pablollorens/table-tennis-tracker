const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

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

async function setupSharedPassword() {
  const password = process.env.NEXT_PUBLIC_SHARED_PASSWORD;

  if (!password) {
    console.error('❌ Error: NEXT_PUBLIC_SHARED_PASSWORD not found in environment variables');
    console.log('Please add it to your .env.local file');
    process.exit(1);
  }

  console.log('🔐 Setting up shared office password...\n');

  const hashedPassword = await bcrypt.hash(password, 10);

  await addDoc(collection(db, 'config'), {
    sharedPasswordHash: hashedPassword,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('✅ Shared password configured successfully!');
  console.log(`📝 Password set to: "${password}"`);
  console.log('\n🎉 Users can now register with this password!');
  process.exit(0);
}

setupSharedPassword().catch((error) => {
  console.error('❌ Error setting up shared password:', error);
  process.exit(1);
});
