import fs from 'fs';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

// 1. Read env variables manually
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

console.log('Firebase config project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const productsCol = collection(db, 'products');

  // STEP 1: Delete old product
  const oldSlug = 'vurlo-mist-mini-humidifier';
  const qOld = query(productsCol, where('slug', '==', oldSlug));
  const snapOld = await getDocs(qOld);
  
  console.log(`Found ${snapOld.size} instances of old product with slug "${oldSlug}".`);
  for (const docSnap of snapOld.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    console.log(`Deleted product: ${docSnap.id}`);
  }

  // Double check if there are other humidifiers to clean up, e.g. vurlo-mistflow-ambient-humidifier if it exists
  const newSlug = 'vurlo-mistflow-ambient-humidifier';
  const qNewOld = query(productsCol, where('slug', '==', newSlug));
  const snapNewOld = await getDocs(qNewOld);
  if (snapNewOld.size > 0) {
    console.log(`Found existing instances of new slug "${newSlug}". Deleting to avoid duplicates.`);
    for (const docSnap of snapNewOld.docs) {
      await deleteDoc(doc(db, 'products', docSnap.id));
      console.log(`Deleted duplicate: ${docSnap.id}`);
    }
  }

  // STEP 2: Add new product
  const newProduct = {
    name: 'Vurlo MistFlow Ambient Humidifier Lamp',
    slug: newSlug,
    price: 799,
    originalPrice: 999,
    images: [
      '/vurlo-mistflow-1.jpg',
      '/vurlo-mistflow-2.jpg',
      '/vurlo-mistflow-3.jpg',
      '/vurlo-mistflow-4.png'
    ],
    description: `Transform your space into a calm, aesthetic sanctuary with the Vurlo MistFlow Ambient Humidifier Lamp.

Designed for modern rooms, desks, and cozy setups, this compact device combines soft ambient lighting with a fine mist to enhance your environment and comfort.

Perfect for relaxation, workspaces, and nighttime ambiance.

Calm your space. Elevate your vibe.`,
    features: [
      'Ultra-fine mist for improved air comfort',
      'Soft ambient glow lighting',
      'Minimal modern design',
      'USB powered convenience',
      'Quiet operation (perfect for sleep)',
      'Compact & portable',
      'Ideal for aesthetic desk & bedroom setups'
    ],
    category: 'Aesthetic Decor',
    tags: [
      'humidifier',
      'ambient light',
      'aesthetic',
      'cozy',
      'desk setup',
      'bedroom',
      'relaxation'
    ],
    rating: 4.3,
    reviewsCount: 42,
    badge: 'NEW',
    active: true,
    isFeatured: true,
    isNew: true,
    createdAt: serverTimestamp()
  };

  const addedDoc = await addDoc(productsCol, newProduct);
  console.log(`Successfully added new product with ID: ${addedDoc.id}`);
}

run()
  .then(() => {
    console.log('Database sync complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running sync:', err);
    process.exit(1);
  });
