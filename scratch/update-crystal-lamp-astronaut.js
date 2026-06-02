import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const brainDir = 'C:/Users/ayush/.gemini/antigravity-ide/brain/7afb4b2f-37c4-44ef-9fb3-ac52e8737db3';
const publicDir = 'c:/Users/ayush/Downloads/vurlo-codebase/public';

// 1. Copy images
const images = [
  { src: 'media__1780416057765.jpg', dest: 'astronaut-1.jpg' },
  { src: 'media__1780416079247.jpg', dest: 'astronaut-2.jpg' },
  { src: 'media__1780416102039.jpg', dest: 'astronaut-3.jpg' },
  { src: 'media__1780416111264.jpg', dest: 'astronaut-4.jpg' }
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
    ...currentImages,
    astronaut: [
      '/astronaut-1.jpg',
      '/astronaut-2.jpg',
      '/astronaut-3.jpg',
      '/astronaut-4.jpg'
    ]
  };

  // Rewrite images map in Firestore
  await updateDoc(doc(db, 'products', docSnap.id), {
    images: updatedImages
  });

  console.log('Successfully updated Vurlo Crystal Aura Lamp in Firestore (added astronaut, kept existing variants).');
}

run().catch(console.error);
