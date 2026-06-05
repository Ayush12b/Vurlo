import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

function getProductSlug(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/^vurlo\s+/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function run() {
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Total products in db: ${snap.size}`);
  snap.docs.forEach(doc => {
    const data = doc.data();
    const currentSlug = data.slug;
    const computedSlug = getProductSlug(data.name);
    console.log(`Name: "${data.name}"\n  Current:  "${currentSlug}"\n  Computed: "${computedSlug}"`);
  });
}

run().catch(console.error);
