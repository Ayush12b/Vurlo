import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// Initialize Firebase
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
  const slug = 'vurlo-sunset-glow-projection-lamp';
  const qOld = query(productsCol, where('slug', '==', slug));
  const snapOld = await getDocs(qOld);
  
  for (const docSnap of snapOld.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    console.log(`Deleted existing product: ${docSnap.id}`);
  }

  // Add product
  const newProduct = {
    name: 'Vurlo Sunset Glow Projection Lamp – RGB Ambient Room Light',
    slug: slug,
    price: 799,
    originalPrice: 1199,
    isOnSale: true,
    onSale: true,
    discountPercentage: Math.round(((1199 - 799) / 1199) * 100),
    discountPercent: Math.round(((1199 - 799) / 1199) * 100),
    images: [
      '/sunset-lamp-1.jpg',
      '/sunset-lamp-2.jpg',
      '/sunset-lamp-3.jpg',
      '/sunset-lamp-4.jpg'
    ],
    description: 'Transform your room into a warm sunset paradise with this viral projection lamp.\n\nCreate a relaxing and dreamy atmosphere with the Vurlo Sunset Projection Lamp. Designed for aesthetic spaces, it projects a stunning sunset glow perfect for bedrooms, gaming setups, and content creation.',
    features: [
      '16+ RGB color modes',
      'Adjustable projection angle',
      'Remote control included',
      'Perfect for reels & photography',
      'USB powered',
      'Energy efficient'
    ],
    category: 'Ambient Lamps', // Fits under Ambient Lamps category
    tags: [
      'sunset lamp',
      'ambient lighting',
      'rgb lamp',
      'bedroom decor',
      'aesthetic light',
      'mood lighting',
      'tiktok lamp'
    ],
    rating: 4.5,
    reviewsCount: 80,
    badge: 'TRENDING',
    stock: 50,
    active: true,
    isActive: true,
    isFeatured: true,
    isNew: true,
    createdAt: serverTimestamp()
  };

  const addedDoc = await addDoc(productsCol, newProduct);
  console.log(`Added new product successfully! ID: ${addedDoc.id}`);
}

run().catch(console.error);
