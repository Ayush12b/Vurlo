import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const brainDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:/Users/ayush/Downloads/vurlo-codebase/public';

// 1. Copy images
const images = [
  { src: 'media__1780401141307.jpg', dest: 'aquawave-1.jpg' },
  { src: 'media__1780401191111.jpg', dest: 'aquawave-2.jpg' },
  { src: 'media__1780401267139.jpg', dest: 'aquawave-3.jpg' },
  { src: 'media__1780401285150.jpg', dest: 'aquawave-4.jpg' }
];

images.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} to ${destPath}`);
});

// 2. Initialize Firebase
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

  // Delete existing with same slug if any
  const slug = 'vurlo-aquawave-projector';
  const qOld = query(productsCol, where('slug', '==', slug));
  const snapOld = await getDocs(qOld);
  
  for (const docSnap of snapOld.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    console.log(`Deleted existing product: ${docSnap.id}`);
  }

  // Add product
  const newProduct = {
    name: 'Vurlo AquaWave Projector Lamp – Ocean Ripple LED Light',
    slug: slug,
    price: 499,
    originalPrice: 799,
    isOnSale: true,
    onSale: true,
    discountPercentage: Math.round(((799 - 499) / 799) * 100),
    discountPercent: Math.round(((799 - 499) / 799) * 100),
    images: [
      '/aquawave-1.jpg',
      '/aquawave-2.jpg',
      '/aquawave-3.jpg',
      '/aquawave-4.jpg'
    ],
    description: 'Transform your space into a calming ocean escape with the Vurlo AquaWave Projector Lamp. Designed to project mesmerizing water ripple effects, this lamp creates a relaxing and immersive atmosphere in any room.\n\nPerfect for bedrooms, gaming setups, or late-night relaxation, it brings a soft ambient glow that instantly upgrades your environment.\n\nTurn your room into a peaceful ocean vibe.',
    features: [
      'Realistic ocean wave projection effect',
      'Multiple RGB color modes',
      'Adjustable brightness levels',
      'Remote control included',
      'USB powered for easy use',
      'Perfect for bedroom, gaming & relaxation',
      'Quiet and energy efficient'
    ],
    category: 'Ambient Lamps', // Matches front-end filter category exactly!
    tags: ['ocean light', 'projector lamp', 'ambient lighting', 'aesthetic', 'bedroom', 'rgb', 'relaxation', 'trending'],
    rating: 4.4,
    reviewsCount: 72,
    badge: 'TRENDING',
    stock: 50,
    active: true,
    isFeatured: true,
    isNew: true,
    createdAt: serverTimestamp()
  };

  const addedDoc = await addDoc(productsCol, newProduct);
  console.log(`Added new product successfully! ID: ${addedDoc.id}`);
}

run().catch(console.error);
