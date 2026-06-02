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
  const slug = 'vurlo-infinity-bloom-lamp';
  const qOld = query(productsCol, where('slug', '==', slug));
  const snapOld = await getDocs(qOld);
  
  for (const docSnap of snapOld.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    console.log(`Deleted existing product: ${docSnap.id}`);
  }

  // Add product
  const newProduct = {
    name: 'Vurlo Infinity Bloom Lamp',
    slug: slug,
    price: 399,
    originalPrice: 699,
    isOnSale: true,
    onSale: true,
    discountPercentage: 43,
    discountPercent: 43,
    images: [
      '/infinity-bloom-1.jpg',
      '/infinity-bloom-2.jpg',
      '/infinity-bloom-3.jpg',
      '/infinity-bloom-4.jpg'
    ],
    image: '/infinity-bloom-1.jpg',
    description: 'Transform your space into a dreamy aesthetic sanctuary with the Vurlo Infinity Bloom Lamp. Designed with a stunning infinity mirror effect, this lamp creates the illusion of endless glowing tulip flowers inside a crystal-clear cube.\n\nWhether you\'re upgrading your bedroom vibe, creating a cozy corner, or looking for the perfect gift, this lamp delivers a soft, warm glow that instantly elevates any space.\n\nIt’s not just a lamp — it’s an experience.',
    features: [
      '🌸 Infinity Mirror Effect - Creates a deep, endless field of glowing tulips for a mesmerizing visual experience',
      '💡 Warm Ambient Lighting - Soft, cozy glow perfect for bedrooms, desks, and aesthetic setups',
      '🎁 Perfect Gift Choice - Ideal for birthdays, anniversaries, and special occasions',
      '🏡 Aesthetic Room Upgrade - Instantly enhances decor for modern, minimal, and cozy interiors',
      '🔌 Easy USB Powered - Plug & play convenience, no complicated setup',
      '📦 Compact & Premium Build - Space-saving cube design with high-quality transparent finish'
    ],
    category: 'Ambient Lamps',
    tags: [
      'tulip lamp',
      'infinity mirror lamp',
      'aesthetic decor',
      'gift lamp',
      'ambient light',
      'tulip',
      'cube lamp',
      'aesthetic lamp',
      'flower lamp'
    ],
    rating: 4.6,
    reviewsCount: 48,
    badge: 'NEW',
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
