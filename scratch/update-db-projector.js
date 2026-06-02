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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const productsCol = collection(db, 'products');

  // STEP 1: Delete incorrect/duplicate products
  // Delete the old "Vurlo Orbit Galaxy Projector Lamp" (slug: vurlo-orbit-galaxy-projector-lamp)
  const oldSlugs = ['vurlo-orbit-galaxy-projector-lamp', 'aura-orbital-galaxy-projector', 'orbit-galaxy-projector'];
  
  for (const slug of oldSlugs) {
    const qOld = query(productsCol, where('slug', '==', slug));
    const snapOld = await getDocs(qOld);
    console.log(`Found ${snapOld.size} instances of product with slug "${slug}".`);
    for (const docSnap of snapOld.docs) {
      await deleteDoc(doc(db, 'products', docSnap.id));
      console.log(`Deleted product: ${docSnap.id} (${docSnap.data().name})`);
    }
  }

  // Also query by name if there are other variations
  const snapAll = await getDocs(productsCol);
  for (const docSnap of snapAll.docs) {
    const data = docSnap.data();
    const name = (data.name || '').toLowerCase();
    if (name.includes('aura orbital') || name.includes('orbital smart galaxy') || data.slug === 'vurlo-orbit-galaxy-projector') {
      await deleteDoc(doc(db, 'products', docSnap.id));
      console.log(`Deleted duplicate/incorrect by name/slug match: ${docSnap.id} (${data.name})`);
    }
  }

  // STEP 2: Add the new product
  const newProduct = {
    name: 'Vurlo Orbit Galaxy Projector – Smart Nebula Room Light',
    slug: 'vurlo-orbit-galaxy-projector',
    price: 799,
    originalPrice: 1299,
    images: [
      '/vurlo-orbit-1.jpg',
      '/vurlo-orbit-2.jpg',
      '/vurlo-orbit-3.jpg',
      '/vurlo-orbit-4.jpg'
    ],
    description: `Turn your room into a breathtaking galaxy with the Vurlo Orbit Galaxy Projector.
Designed to create a relaxing, immersive atmosphere, this projector fills your walls and ceiling with stunning nebula clouds and stars.

Perfect for bedrooms, gaming setups, and aesthetic interiors, it instantly upgrades your space into a cosmic experience.

Whether you're relaxing, sleeping, or setting a vibe — Orbit does it all.

Escape your room. Enter your galaxy.`,
    features: [
      'Stunning galaxy & nebula light projection',
      'Multiple color modes & brightness control',
      'Adjustable projection angles',
      'Remote control included',
      'Perfect for bedroom, gaming & relaxation',
      'Creates calming & immersive atmosphere',
      'Energy efficient & long-lasting'
    ],
    category: 'Aesthetic Decor',
    tags: [
      'galaxy',
      'projector',
      'orbit',
      'astronaut',
      'room decor',
      'ambient light',
      'aesthetic',
      'trending'
    ],
    rating: 4.6,
    reviewsCount: 140,
    badge: 'BEST SELLER',
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
    console.log('Projector database sync complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running sync:', err);
    process.exit(1);
  });
