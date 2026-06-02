import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const config = {};
envLocal.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) {
    config[parts[0].trim()] = parts[1].trim();
  }
});

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const oldDocId = 'EpA5qlrwIWFzW1ZhyWRu';
  await deleteDoc(doc(db, 'products', oldDocId));
  console.log(`Successfully deleted legacy humidifier product with ID: ${oldDocId}`);
}

run().catch(console.error);
