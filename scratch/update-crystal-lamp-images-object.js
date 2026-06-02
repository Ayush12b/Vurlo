import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';

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
  
  // Set images to the variant map structure
  const updatedImages = {
    galaxy: [
      '/vurlo-galaxy-1.jpg',
      '/vurlo-galaxy-2.jpg',
      '/vurlo-galaxy-3.jpg',
      '/vurlo-galaxy-4.jpg'
    ],
    moon: [
      '/vurlo-moon-1.jpg',
      '/vurlo-moon-2.jpg',
      '/vurlo-moon-3.jpg',
      '/vurlo-moon-4.jpg'
    ],
    solar: []
  };

  await updateDoc(doc(db, 'products', docSnap.id), {
    images: updatedImages,
    variants: deleteField() // Remove old variants array to avoid schema confusion
  });
  console.log('Successfully migrated vurlo-crystal-aura-lamp to the new variant-images-object schema!');
}

run().catch(console.error);
