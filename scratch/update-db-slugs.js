import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
  console.log("Starting product slug migration...");
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Found ${snap.size} products to process.`);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const newSlug = getProductSlug(data.name);
    console.log(`Product: "${data.name}"`);
    console.log(`  Current Slug:  "${data.slug}"`);
    console.log(`  Target Slug:   "${newSlug}"`);
    
    if (data.slug !== newSlug) {
      await updateDoc(doc(db, 'products', docSnap.id), { slug: newSlug });
      console.log(`  -> Updated slug successfully.`);
    } else {
      console.log(`  -> Slug is already correct. No update needed.`);
    }
  }
  console.log("Migration complete!");
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
