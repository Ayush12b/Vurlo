import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const brainDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:/Users/ayush/Downloads/vurlo-codebase/public';

// 1. Copy images
const images = [
  { src: 'media__1780415388291.jpg', dest: 'saturn-1.jpg' },
  { src: 'media__1780415415646.jpg', dest: 'saturn-2.jpg' },
  { src: 'media__1780415429007.jpg', dest: 'saturn-3.jpg' },
  { src: 'media__1780415443967.jpg', dest: 'saturn-4.jpg' }
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
  const q = query(productsCol, where('slug', '==', 'vurlo-crystal-aura-lamp'));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    console.log('Crystal Aura Lamp product not found!');
    return;
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  console.log(`Found product with ID: ${docSnap.id}. Name: ${data.name}`);

  // Construct new images map
  const currentImages = data.images || {};
  const updatedImages = {
    galaxy: currentImages.galaxy || [
      '/vurlo-galaxy-1.jpg',
      '/vurlo-galaxy-2.jpg',
      '/vurlo-galaxy-3.jpg',
      '/vurlo-galaxy-4.jpg'
    ],
    moon: currentImages.moon || [
      '/vurlo-moon-1.jpg',
      '/vurlo-moon-2.jpg',
      '/vurlo-moon-3.jpg',
      '/vurlo-moon-4.jpg'
    ],
    saturn: [
      '/saturn-1.jpg',
      '/saturn-2.jpg',
      '/saturn-3.jpg',
      '/saturn-4.jpg'
    ]
  };

  // We must delete the solar key. Storing it as above (without solar) and rewriting images is sufficient.
  await updateDoc(doc(db, 'products', docSnap.id), {
    images: updatedImages,
    defaultVariant: 'Galaxy'
  });

  console.log('Successfully updated Vurlo Crystal Aura Lamp in Firestore (added saturn, removed solar, set defaultVariant to Galaxy).');
}

run().catch(console.error);
