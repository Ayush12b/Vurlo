import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

const seoUpdates = {
  "lunar-wooden-3d-moon-lamp": {
    name: "Vurlo 3D Lunar Moon Lamp – Premium Wooden Base Aesthetic Night Light for Bedroom",
    description: "Transform your room into a serene, glowing sanctuary with the Vurlo 3D Lunar Moon Lamp. Using advanced 3D printing technology, this realistic moon light sphere replicates the actual craters and topography of the lunar surface. Sized perfectly to rest on a premium wooden base, it adds an organic touch of aesthetic room decor to any nightstand, study desk, or corner table. Featuring dual-color light modes, you can easily toggle between a cool white glow and warm yellow illumination to suit your mood. Whether you are winding down after a busy day, meditating, or setting a cozy night vibe, this ambient lighting solution delivers the perfect level of brightness. It makes an excellent gift for space lovers and a top choice for bedroom lighting in India. Upgrade your setup's daily atmosphere with this stunning combination of modern design and realistic detail. It functions as both a decorative piece and a comforting night lamp, bringing the beauty of the solar system directly into your personal space."
  },
  "panda-glow-lamp": {
    name: "Cute Panda Night Lamp – Soft LED Aesthetic Light for Bedroom | Vurlo",
    description: "Bring a warm, cute, and calming atmosphere to your bedroom or nursery with the Vurlo Cute Panda Night Lamp. Crafted from high-quality, BPA-free soft silicone, this adorable panda night light is gentle to the touch, squeezeable, and completely safe for kids and toddlers. Tap the soft silicone body to cycle through a variety of colors, creating a soothing room light tailored to your evening setup. It's the perfect bedside companion, offering a soft glow that aids relaxation and sleep. Whether you're looking for a charming room decor accent, a sleeping companion, or a creative gift in India, this LED night light brings playfulness and coziness together. Elevate your bedroom lighting and aesthetic room decor with this trending, rechargeable panda glow light. With its RGB lighting modes and tap control, you can customize the mood in seconds. It provides wireless portability with a built-in battery, ensuring a cozy night's sleep without cords."
  },
  "mistflow-ambient-humidifier-lamp": {
    name: "Vurlo MistFlow Humidifier Lamp – Cool Mist Aesthetic Desk Light & Ambient Glow",
    description: "Transform your workspace or bedroom into a peaceful sanctuary with the Vurlo MistFlow Humidifier Lamp. This 2-in-1 device combines a fine, soothing cool mist with soft ambient lighting to elevate your environment's air quality and aesthetic vibe. Specially designed for modern desk setups, it operates silently under 30dB to ensure your focus, reading, or sleep remains completely uninterrupted. The elegant minimalist styling makes it a premium decor piece even when turned off. Ideal for dry rooms, it adds essential moisture to the air while enveloping your room in a warm, relaxing glow. Perfect for aesthetic setups in India, it helps you relax, breathe better, and upgrade your room's bedroom lighting and desk layout. Add a touch of RGB lighting or warm ambient glow to set the tone for relaxation. It is the perfect fusion of functional wellness and modern aesthetic room decor, bringing comfort and style together."
  },
  "sunset-glow-projection-lamp": {
    name: "Vurlo Sunset Projection Lamp – RGB Ambient Light for Gaming Setup & Bedroom Decor",
    description: "Bring the warm, golden hues of a beautiful sunset directly into your space with the Vurlo Sunset Projection Lamp. As a viral sensation on TikTok and Instagram, this projection lamp is a must-have for content creators, photographers, and anyone looking to create an aesthetic room decor setup. It projects a realistic sunset circle on your walls or ceiling, casting a warm and calming glow that instantly transforms the vibe. Made with a heavy-duty aluminum base and high-definition crystal lens, it offers 360-degree rotation to adjust the size and shape of the halo. Ideal for cozy gaming setups, bedrooms, and artistic background photography in India, this RGB lighting fixture adds rich warmth and mood lighting to any corner. Upgrade your bedroom lighting with dynamic colors and set a relaxing tone for sleep or focus. It's a premium ambient lighting solution designed to elevate daily life."
  },
  "orbit-galaxy-projector": {
    name: "Vurlo Orbit Galaxy Projector – Smart Nebula Night Lamp & Gaming Setup Light",
    description: "Escape reality and enter your own cosmic sky with the Vurlo Orbit Galaxy Projector. This smart nebula room light projects high-definition moving nebula clouds and laser stars across your walls and ceiling. With customizable RGB lighting color combinations, speed settings, and brightness controls, you can create a relaxing cosmic sky perfect for unwinding after a long day, sleeping under the stars, or lighting up a party. The sleek futuristic design fits perfectly in modern gaming setups, bedrooms, and home theaters. It serves as a calming night light for children and an immersive ambient lighting setup for adults. Upgrade your room into a cosmic experience with this premium galaxy light in India. Perfect for creating a modern aesthetic room decor look, this projector brings celestial magic right into your home. Experience cozy bedroom lighting that feels out of this world and elevates your setup's mood."
  },
  "aquawave-projector-lamp": {
    name: "Vurlo AquaWave Projector Lamp – Ocean Ripple Kinetic RGB Ambient Lighting",
    description: "Experience the serene tranquility of moving water with the Vurlo AquaWave Projector Lamp. This premium ocean ripple LED light casts organic, fluid water wave effects across your walls, mimicking the calming motion of underwater currents. Crafted with a premium crystal acrylic shade and a wooden base, it looks stunningly elegant as a piece of decor even during the day. It features multiple RGB lighting color modes, letting you shift from warm relaxation tones to vibrant ocean blues or sunset purples. Designed for bedroom lighting, gaming desk backdrops, and sensory relaxation rooms, it helps melt away stress and anxiety. Elevate your room vibe in India with this unique kinetic light. Rest it on a nightstand or shelf to create a beautiful ambient lighting backdrop for sleep or reading. It is the ultimate addition to any modern aesthetic room decor setup, offering motion, color, and comfort."
  },
  "aura-rgb-led-strip-lights": {
    name: "Vurlo Aura RGB LED Strip Lights – Smart Setup Backlighting & Ambient Glow Kit",
    description: "Upgrade your entire room with vibrant, customizable glow using the Vurlo Aura RGB LED Strip Lights. Spanning 3.5 meters, this smart room glow kit is perfect for outlining desks, TV backs, beds, or ceilings. With millions of colors and dynamic RGB lighting modes, you can set the perfect ambiance for movies, gaming sessions, or late-night reading. The self-adhesive backing allows for quick, tool-free installation on any dry, flat surface. You can trim the strip to fit your exact measurements. Controlled via remote or smart controller, it offers seamless brightness and mode adjustment. It's the ultimate base layer for modern bedroom lighting and gaming setups in India. Create a stunning aesthetic room decor setup that reacts to your music or game audio. Transform ordinary spaces into an immersive experience with high-density, bright LEDs that provide stable, premium ambient lighting for everyday enjoyment."
  },
  "crystal-aura-lamp": {
    name: "Vurlo 3D Crystal Aura Lamp – Glass Ball Night Light & Aesthetic Room Decor",
    description: "Elevate your setup with the mystical elegance of the Vurlo Crystal Aura Lamp. Featuring a heavy, solid glass sphere with high-precision 3D laser engraving inside, this lamp projects a beautiful ambient lighting pattern that illuminates the detailed cosmic design within. It rests on a minimalist natural wood base equipped with warm LED light. The light refracts through the crystal sphere to project a stunning pattern on the ceiling. Perfect for bedside tables, aesthetic room decor, study desks, and shelves, it adds a touch of wonder to any room. It is also an exquisite, premium gift for space lovers and decor enthusiasts in India. Upgrade your bedroom lighting with this unique piece that functions as a night light and an ornament. Introduce soft RGB lighting effects to your space and enjoy a relaxing environment. It is a stunning decorative piece built to last and inspire."
  },
  "infinity-bloom-lamp": {
    name: "Vurlo Infinity Bloom Lamp – Handmade Tulip Mirror Night Lamp & Bedroom Decor",
    description: "Discover the magical optical illusion of the Vurlo Infinity Bloom Lamp. Using a clever combination of double-sided mirrors and warm LED lights, this lamp creates the illusion of an endless, glowing field of beautiful tulips stretching inside a clear glass cube. When turned on, it is a glowing field of flowers; when turned off, the outer shell serves as a sleek, modern desktop mirror. The perfect blend of nature-inspired beauty and futuristic optical illusion, it instantly adds cozy warmth and a dreamy aesthetic room decor touch to any room. Handcrafted to perfection, it is the best gift to wow a loved one and elevate room styling in India. Upgrade your bedroom lighting with this beautiful lamp that doubles as a functional vanity mirror. Set the tone with warm ambient lighting or add RGB lighting details to your gaming desk or bedside table, transforming your space into a peaceful oasis."
  }
};

async function run() {
  console.log("Starting product details SEO migration...");
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Found ${snap.size} products to process in collection.`);

  let updatedCount = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const slug = data.slug;
    
    if (seoUpdates[slug]) {
      const updateData = seoUpdates[slug];
      console.log(`\nProduct slug: "${slug}"`);
      console.log(`  Updating name to: "${updateData.name.substring(0, 40)}..."`);
      
      await updateDoc(doc(db, 'products', docSnap.id), {
        name: updateData.name,
        description: updateData.description
      });
      console.log(`  -> Successfully updated document ID: ${docSnap.id}`);
      updatedCount++;
    } else {
      console.log(`\nProduct slug: "${slug}" -> No updates defined for this slug.`);
    }
  }
  console.log(`\nMigration complete! Updated ${updatedCount} products.`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
