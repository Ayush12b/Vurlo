import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const brainDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:/Users/ayush/Downloads/vurlo-codebase/public';

// 1. Copy files
const newImages = [
  { src: 'media__1780400015548.jpg', dest: 'vurlo-moon-2.jpg' },
  { src: 'media__1780400036041.jpg', dest: 'vurlo-moon-3.jpg' },
  { src: 'media__1780400069903.jpg', dest: 'vurlo-moon-4.jpg' }
];

newImages.forEach(({ src, dest }) => {
  const srcPath = path.join(brainDir, src);
  const destPath = path.join(publicDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${src} to ${destPath}`);
});

// 2. Read env variables manually to initialize Firebase
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
    console.log('Product not found!');
    return;
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  
  // Find variants and update Moon
  const updatedVariants = data.variants.map(v => {
    if (v.name.toLowerCase() === 'moon') {
      return {
        ...v,
        images: [
          '/vurlo-moon-1.jpg',
          '/vurlo-moon-2.jpg',
          '/vurlo-moon-3.jpg',
          '/vurlo-moon-4.jpg'
        ]
      };
    }
    return v;
  });

  await updateDoc(doc(db, 'products', docSnap.id), {
    variants: updatedVariants
  });
  console.log('Firestore document updated successfully with the 4 Moon variant images!');
}

run().catch(console.error);
