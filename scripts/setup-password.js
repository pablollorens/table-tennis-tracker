const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
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

async function setupPassword() {
  const password = 'pingpong'; // Default password
  const hashedPassword = await bcrypt.hash(password, 10);

  await setDoc(doc(db, 'settings', 'password'), {
    hashedPassword,
    updatedAt: serverTimestamp(),
  });

  console.log('✅ Password set successfully!');
  console.log('Default password: "pingpong"');
  console.log('You can now log in to the app.');
  process.exit(0);
}

setupPassword().catch((error) => {
  console.error('Error setting up password:', error);
  process.exit(1);
});
