const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');
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

function promptPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter the shared office password: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function setupSharedPassword() {
  console.log('🔐 Setting up shared office password...\n');

  const password = await promptPassword();

  if (!password || password.trim() === '') {
    console.error('❌ Error: Password cannot be empty');
    process.exit(1);
  }

  console.log('\n⏳ Hashing password and storing in Firebase...');

  const hashedPassword = await bcrypt.hash(password, 10);

  await addDoc(collection(db, 'config'), {
    sharedPasswordHash: hashedPassword,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('✅ Shared password configured successfully!');
  console.log(`📝 Password set to: "${password}"`);
  console.log('\n🎉 Users can now register with this password!');
  console.log('⚠️  Make sure to communicate this password securely to your team.');
  process.exit(0);
}

setupSharedPassword().catch((error) => {
  console.error('❌ Error setting up shared password:', error);
  process.exit(1);
});
