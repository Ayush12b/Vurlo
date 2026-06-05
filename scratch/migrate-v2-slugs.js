import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

// Map product names to their correct slugs as required
const NAME_TO_SLUG_MAP = {
  "Vurlo Lunar wooden 3D Moon Lamp": "lunar-wooden-3d-moon-lamp",
  "Vurlo Panda Glow Lamp – Soft LED Night Light": "panda-glow-lamp",
  "Vurlo MistFlow Ambient Humidifier Lamp": "mistflow-ambient-humidifier-lamp",
  "Vurlo Sunset Glow Projection Lamp – RGB Ambient Room Light": "sunset-glow-projection-lamp",
  "Vurlo Orbit Galaxy Projector – Smart Nebula Room Light": "orbit-galaxy-projector",
  "Vurlo AquaWave Projector Lamp – Ocean Ripple LED Light": "aquawave-projector-lamp",
  "Vurlo Aura RGB LED Strip Lights (3.5M) – Smart Room Glow Kit": "aura-rgb-led-strip-lights",
  "Vurlo Crystal Aura Lamp – 3D LED Glass Ball": "crystal-aura-lamp",
  "Vurlo Infinity Bloom Lamp": "infinity-bloom-lamp"
};

async function run() {
  console.log("Starting product slug v2 migration...");
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Found ${snap.size} total products in database.`);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const id = docSnap.id;
    const name = data.name || "";
    const currentSlug = data.slug;

    // Check for old/incorrect duplicate or orphan slugs to remove
    if (currentSlug === "sunset-projection-lamp" || currentSlug === "vurlo-sunset-projection-lamp") {
      console.log(`Deleting incorrect slug document: ID=${id}, Name="${name}", Slug="${currentSlug}"`);
      await deleteDoc(doc(db, 'products', id));
      continue;
    }

    // Determine the target slug
    let targetSlug = NAME_TO_SLUG_MAP[name];
    if (!targetSlug) {
      // Fallback generator for other/new products to ensure no product exists without a slug
      targetSlug = name
        .toLowerCase()
        .replace(/^vurlo\s+/i, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (!targetSlug) {
      targetSlug = "unnamed-product-" + id;
    }

    console.log(`Product: "${name}"`);
    console.log(`  Current Slug: "${currentSlug}"`);
    console.log(`  Target Slug:  "${targetSlug}"`);

    if (currentSlug !== targetSlug) {
      await updateDoc(doc(db, 'products', id), { slug: targetSlug });
      console.log(`  -> Updated slug successfully.`);
    } else {
      console.log(`  -> Slug is already correct.`);
    }
  }
  console.log("Migration v2 complete!");
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
