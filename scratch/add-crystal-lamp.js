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

  // STEP 1: Delete old product if any exists
  const slug = 'vurlo-crystal-aura-lamp';
  const qOld = query(productsCol, where('slug', '==', slug));
  const snapOld = await getDocs(qOld);
  
  console.log(`Found ${snapOld.size} instances of product with slug "${slug}".`);
  for (const docSnap of snapOld.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    console.log(`Deleted product: ${docSnap.id}`);
  }

  // STEP 2: Add the new product with variants
  const newProduct = {
    name: 'Vurlo Crystal Aura Lamp – 3D LED Glass Ball',
    slug: slug,
    price: 799,
    originalPrice: 1299,
    images: [], // Handled dynamically in useProducts, but we can store the Galaxy cover here too just in case
    description: `Premium 3D crystal lamp designed to elevate your space with soft ambient lighting and precision laser engraving.`,
    features: [
      '3D laser engraved crystal',
      'Wooden LED base',
      'USB powered',
      'Soft ambient lighting',
      'Premium gift item'
    ],
    category: 'Aesthetic Decor',
    tags: ['crystal lamp', 'moon lamp', 'galaxy lamp'],
    rating: 4.5,
    reviewsCount: 120,
    badge: null,
    stock: 50,
    active: true,
    isFeatured: true,
    isNew: true,
    defaultVariant: 'Galaxy',
    variants: [
      {
        name: 'Galaxy',
        images: [
          '/vurlo-galaxy-1.jpg',
          '/vurlo-galaxy-2.jpg',
          '/vurlo-galaxy-3.jpg',
          '/vurlo-galaxy-4.jpg'
        ]
      },
      {
        name: 'Moon',
        images: [
          '/vurlo-moon-1.jpg'
        ]
      },
      {
        name: 'Solar',
        images: []
      }
    ],
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
