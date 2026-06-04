/**
 * restore-crystal-lamp-images.js
 *
 * Writes Vercel-hosted public image URLs directly to Firestore.
 * No Firebase Storage needed. No Blaze plan needed.
 * Images must exist in /public folder and be deployed to Vercel.
 *
 * Run from project root:
 *   node scratch/restore-crystal-lamp-images.js
 */

import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

// Read env variables manually from .env.local to avoid the invalid/corrupted private key in .env
const envLocal = fs.readFileSync(".env.local", "utf-8");
const config = {};
envLocal.split("\n").forEach((line) => {
  const parts = line.split("=");
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
  appId: config.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PRODUCT_DOC_ID = "g5N9MGn7MIRhdob45iEz";
const BASE = "https://vurlo.store";

const images = {
  galaxy: [
    `${BASE}/vurlo-galaxy-1.jpg`,
    `${BASE}/vurlo-galaxy-2.jpg`,
    `${BASE}/vurlo-galaxy-3.jpg`,
    `${BASE}/vurlo-galaxy-4.jpg`,
  ],
  moon: [
    `${BASE}/vurlo-moon-1.jpg`,
    `${BASE}/vurlo-moon-2.jpg`,
    `${BASE}/vurlo-moon-3.jpg`,
    `${BASE}/vurlo-moon-4.jpg`,
  ],
  saturn: [
    `${BASE}/saturn-1.jpg`,
    `${BASE}/saturn-2.jpg`,
    `${BASE}/saturn-3.jpg`,
    `${BASE}/saturn-4.jpg`,
  ],
  astronaut: [
    `${BASE}/astronaut-1.jpg`,
    `${BASE}/astronaut-2.jpg`,
    `${BASE}/astronaut-3.jpg`,
    `${BASE}/astronaut-4.jpg`,
  ],
};

async function main() {
  console.log("\n🚀 Restoring crystal lamp images in Firestore...\n");

  await updateDoc(doc(db, "products", PRODUCT_DOC_ID), {
    images,
    image: images.galaxy[0],
    defaultVariant: "Galaxy",
  });

  console.log("✅ Done! Firestore updated.");
  console.log(`   image (main): ${images.galaxy[0]}`);
  console.log(`   defaultVariant: Galaxy`);
  console.log(`   Variants: ${Object.keys(images).join(", ")}`);
  console.log(`   Total images: ${Object.values(images).flat().length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
