export interface SeoProductData {
  description: string;
  useCases: string[];
  whyBuy: string[];
  faqs: { question: string; answer: string }[];
}

export const PRODUCT_SEO_DATA: Record<string, SeoProductData> = {
  "lunar-wooden-3d-moon-lamp": {
    description: "The Vurlo Lunar wooden 3D Moon Lamp is a premium aesthetic room light designed to bring the calming radiance of the moon right into your bedroom. Using advanced 3D printing technology, this lamp reproduces the realistic topography of the lunar surface. It sits on an elegant, modern wooden base that blends seamlessly with any nightstand, shelf, or desk setup. It features adjustable lighting modes, allowing you to toggle between warm yellow and cool white glows to match your mood. Ideal for relaxation, meditation, or as a gentle night light, it adds a touch of celestial beauty to your space. Upgrade your ambient bedroom lighting and elevate your home decor in India with this stunning modern piece.",
    useCases: [
      "Bedside table ambient lighting for nightly relaxation",
      "Cozy reading nook accent to reduce eye strain",
      "Meditation room or yoga space calming backdrop"
    ],
    whyBuy: [
      "Realistic 3D textured detailing mimicking actual moon topography",
      "Premium solid natural wooden stand for an organic styling touch",
      "Dual-color adjustable light control (warm yellow and cool white)"
    ],
    faqs: [
      {
        question: "Does the moon lamp have multiple colors?",
        answer: "Yes, you can toggle between warm yellow and cool white tones to suit your room's vibe."
      },
      {
        question: "How is the lamp powered?",
        answer: "It is USB powered for maximum convenience and compatibility with phone chargers or laptops."
      },
      {
        question: "Is the wooden stand included in the package?",
        answer: "Yes, each moon lamp comes with a high-quality, easy-to-assemble solid wooden stand."
      }
    ]
  },
  "panda-glow-lamp": {
    description: "Bring a warm, cute, and calming atmosphere to your bedroom or nursery with the Vurlo Panda Glow Lamp. Crafted from high-quality, BPA-free soft silicone, this adorable panda night light is gentle to the touch and completely safe for kids and toddlers. Tap the soft silicone body to cycle through a variety of colors, creating a soothing room light tailored to your evening setup. It's the perfect bedside companion, offering a soft glow that aids relaxation and sleep. Whether you're looking for a charming room decor accent or the best cute gift in India, this LED night light brings playfulness and coziness together.",
    useCases: [
      "Nursery or kids room soothing nighttime sleeping companion",
      "Bedside table cute ambient decor accent",
      "Playful study desk character lighting"
    ],
    whyBuy: [
      "Safe, eco-friendly BPA-free soft silicone structure",
      "Intuitive tap-sensitive color changing touch control",
      "Long-lasting rechargeable battery offering wireless portability"
    ],
    faqs: [
      {
        question: "How do you change colors on the panda lamp?",
        answer: "Simply tap the soft silicone body to toggle between warm white light, rotating color modes, and individual static colors."
      },
      {
        question: "Is the material safe for children?",
        answer: "Absolutely. It is made of child-safe, BPA-free soft silicone that is soft, squeezeable, and stays completely cool to the touch."
      },
      {
        question: "How long does the battery last on a single charge?",
        answer: "The built-in rechargeable battery provides up to 10 hours of warm white night light on a full charge."
      }
    ]
  },
  "mistflow-ambient-humidifier-lamp": {
    description: "Transform your bedroom, study, or workspace into a peaceful sanctuary with the Vurlo MistFlow Ambient Humidifier Lamp. This 2-in-1 device combines a fine, soothing cool mist with soft ambient lighting to elevate your environment's air quality and aesthetic vibe. Specially designed for modern desk setups, it operates silently to ensure your focus or sleep remains uninterrupted. The elegant minimalist styling makes it a premium decor piece even when turned off. Ideal for dry rooms, it adds essential moisture to the air while enveloping your room in a warm, relaxing glow. Perfect for aesthetic setups in India, it helps you relax, breathe better, and upgrade your room's lighting setup.",
    useCases: [
      "Desk setup air humidifier to improve focus and workspace comfort",
      "Bedroom ambient night light to soothe sleep and ease dry throat",
      "Aromatherapy relaxation companion to disperse essential oil mist"
    ],
    whyBuy: [
      "Dual-function design delivering both humidification and soft illumination",
      "Ultra-silent misting operation below 30dB for peaceful nights",
      "Sleek and compact minimalist shape fitting any modern desk layout"
    ],
    faqs: [
      {
        question: "Can I use essential oils with the MistFlow humidifier?",
        answer: "Yes, you can add a few drops of water-soluble essential oils into the water tank to enjoy relaxing aromatherapy."
      },
      {
        question: "How often do I need to refill the water tank?",
        answer: "The mist tank holds enough water to provide up to 6 hours of continuous misting before needing a refill."
      },
      {
        question: "Does it turn off automatically when empty?",
        answer: "Yes, it features an intelligent water-less auto-shutoff system to protect the device from damage."
      }
    ]
  },
  "sunset-glow-projection-lamp": {
    description: "Bring the warm, golden hues of a beautiful sunset directly into your home with the Vurlo Sunset Glow Projection Lamp. As a viral sensation on TikTok and Instagram, this projection lamp is a must-have for content creators, photographers, and anyone looking to create an aesthetic bedroom setup. It projects a stunning, realistic sunset circle on your walls or ceiling, casting a warm and calming glow that instantly transforms the vibe. Made with a heavy-duty aluminum base and high-definition crystal lens, it offers 360-degree rotation to adjust the size and shape of the halo. Ideal for bedroom lighting, cozy gaming setups, and artistic background photography in India, this RGB light adds rich warmth and mood lighting to any corner.",
    useCases: [
      "Background projection for aesthetic photoshoots and TikTok videos",
      "Cozy gaming setup mood lighting or media center glow",
      "Relaxing warm golden hour vibes in bedrooms and living spaces"
    ],
    whyBuy: [
      "High-definition crystal lens for ultra-vibrant, sharp projections",
      "Flexible 360-degree rotating head to control halo angles and size",
      "Heavy-duty aluminum construction with stable base for durability"
    ],
    faqs: [
      {
        question: "Can I adjust the size of the projected sunset circle?",
        answer: "Yes! Simply move the lamp further away from the wall to make the projection larger, or bring it closer to make it smaller."
      },
      {
        question: "How flexible is the lamp head rotation?",
        answer: "The projection head can rotate 180 degrees vertically and 360 degrees horizontally, letting you project on ceilings, floors, or walls."
      },
      {
        question: "Is it powered by USB?",
        answer: "Yes, it comes with a USB power cable that features an inline on/off switch, making it easy to plug into power banks or adaptors."
      }
    ]
  },
  "orbit-galaxy-projector": {
    description: "Escape reality and enter your own cosmic sky with the Vurlo Orbit Galaxy Projector. This smart nebula room light projects high-definition moving nebula clouds and laser stars across your walls and ceiling. With customizable color combinations, speed settings, and brightness controls, you can create a relaxing cosmic sky perfect for unwinding after a long day, sleeping under the stars, or lighting up a party. The sleek futuristic design fits perfectly in modern gaming setups, bedrooms, and home theaters. It serves as a calming night light for children and an immersive ambient lighting setup for adults. Upgrade your room into a cosmic experience with this premium galaxy light in India.",
    useCases: [
      "Cosmic starry ceiling projection for relaxing bedtime routines",
      "Immersive gaming room setup and streaming background lights",
      "Home theater background lighting or party mood accent"
    ],
    whyBuy: [
      "Customizable RGB color blending modes to project unique nebulas",
      "Realistic moving clouds and sparkling green laser stars",
      "Wireless remote control to adjust brightness, speed, and patterns easily"
    ],
    faqs: [
      {
        question: "Can I turn off the stars and keep only the nebula clouds?",
        answer: "Yes, the remote control allows you to toggle the laser stars and moving nebula clouds independently."
      },
      {
        question: "Does it have a timer function?",
        answer: "Yes, it features a built-in auto-off timer (usually 1 or 2 hours) so you can fall asleep under the stars without leaving it on all night."
      },
      {
        question: "How do I control the speed of the nebula rotation?",
        answer: "The included remote has dedicated buttons to speed up, slow down, or completely freeze the nebula movement."
      }
    ]
  },
  "aquawave-projector-lamp": {
    description: "Experience the serene tranquility of moving water with the Vurlo AquaWave Projector Lamp. This premium ocean ripple LED light casts organic, fluid water wave effects across your walls, mimicking the calming motion of under-water currents. Crafted with a premium crystal acrylic shade and a wooden base, it looks stunningly elegant as a piece of decor even during the day. It features multiple color modes, letting you shift from warm relaxation tones to vibrant ocean blues or sunset purples. Designed for bedroom ambient lighting, gaming desk backdrops, and sensory relaxation rooms, it helps melt away stress and anxiety. Elevate your room vibe in India with this unique and beautiful kinetic light.",
    useCases: [
      "Bedroom calming night light mimicking gentle underwater waves",
      "Gaming desk backdrop or ambient setup accent",
      "Sensory relaxation room or meditation room calming light"
    ],
    whyBuy: [
      "Mesmerizing moving water ripple projection created by internal motor",
      "Premium faceted crystal acrylic shade resting on natural wooden base",
      "Multiple color schemes and rotation speeds to customize the wave mood"
    ],
    faqs: [
      {
        question: "Does the ripple effect actually rotate or move?",
        answer: "Yes! The lamp has an internal motor that rotates the LED core, projecting fluid, organic water ripples that move smoothly."
      },
      {
        question: "Is it bright enough to illuminate a full room?",
        answer: "It projects a wide, bright wash of wave patterns that can easily cover a medium-sized bedroom ceiling and walls."
      },
      {
        question: "Can I stop the ripples from rotating?",
        answer: "Yes, you can pause the rotation to enjoy a static crystal light pattern using the remote control."
      }
    ]
  },
  "aura-rgb-led-strip-lights": {
    description: "Upgrade your entire room with vibrant, customizable glow using the Vurlo Aura RGB LED Strip Lights. Spanning 3.5 meters, this smart room glow kit is perfect for outlining desks, TV backs, beds, or ceilings. With millions of colors and dynamic lighting modes, you can set the perfect ambiance for movies, gaming sessions, or late-night reading. The self-adhesive backing allows for quick, tool-free installation on any dry, flat surface. You can trim the strip to fit your exact measurements. Controlled via remote or smart controller, it offers seamless brightness and mode adjustment. It's the ultimate base layer for modern bedroom lighting and gaming setups in India.",
    useCases: [
      "Gaming desk backlighting and setup accent lighting",
      "Bedroom under-bed mood glow or ceiling outline accent",
      "TV backlighting to reduce eye strain and improve screen contrast"
    ],
    whyBuy: [
      "Generous 3.5-meter length of high-density, bright RGB LEDs",
      "Strong self-adhesive backing for simple tool-free installation",
      "Sound-sensitive music synchronization and dynamic pulsing modes"
    ],
    faqs: [
      {
        question: "Can these LED strip lights be cut to size?",
        answer: "Yes, there are marked copper cutting lines along the strip where you can safely cut it to your exact desired length."
      },
      {
        question: "How do I mount the strip lights?",
        answer: "Simply peel the protective film off the back of the strip to expose the strong double-sided adhesive, then press it onto a clean, dry surface."
      },
      {
        question: "Do they sync with music or game audio?",
        answer: "Yes, the controller has a built-in high-sensitivity microphone that detects sound and pulses the colors in sync with your audio."
      }
    ]
  },
  "crystal-aura-lamp": {
    description: "Elevate your setup with the mystical elegance of the Vurlo Crystal Aura Lamp. Featuring a heavy, solid glass sphere with high-precision 3D laser engraving inside, this lamp projects a beautiful ambient light that illuminates the detailed cosmic or solar system design within. It rests on a minimalist natural wood base equipped with warm LED light. The light refracts through the crystal sphere to project a stunning pattern on the ceiling. Perfect for bedside tables, aesthetic study desks, and shelves, it adds a touch of wonder to any room. It is also an exquisite, premium gift for astronomers, space lovers, and decor enthusiasts in India.",
    useCases: [
      "Bedside table ornament or calming bedroom night light",
      "Aesthetic desk setup focal point or shelf styling accessory",
      "Cosmic themed room decor or creative photography prop"
    ],
    whyBuy: [
      "High-precision 3D internal laser engraving (Saturn, Moon, or Galaxy themes)",
      "Solid, heavy crystal glass sphere offering supreme visual clarity",
      "Natural warm-glow wooden base that complements modern room decor"
    ],
    faqs: [
      {
        question: "What designs are engraved inside the crystal glass?",
        answer: "The crystal ball features space designs like detailed Saturn rings, astronomers floating in space, or moving galaxies."
      },
      {
        question: "Does the wooden base get hot?",
        answer: "No, the base utilizes energy-efficient, cool LEDs that stay completely cold, making it safe to leave on for hours."
      },
      {
        question: "What is the source of power?",
        answer: "It is powered by a standard USB cable that can plug into any USB adapter, computer port, or power bank."
      }
    ]
  },
  "infinity-bloom-lamp": {
    description: "Discover the magical optical illusion of the Vurlo Infinity Bloom Lamp. Using a clever combination of double-sided mirrors and warm LED lights, this lamp creates the illusion of an endless, glowing field of beautiful tulips stretching inside a clear glass cube. When turned on, it is a glowing field of flowers; when turned off, the outer shell serves as a sleek, modern desktop mirror. The perfect blend of nature-inspired beauty and futuristic optical illusion, it instantly adds cozy warmth and a dreamy aesthetic to any bedroom, vanity table, or shelf setup. Handcrafted to perfection, it is the best gift to wow a loved one and elevate room styling in India.",
    useCases: [
      "Cozy vanity table mirror and decorative desk light",
      "Bedroom nightstand aesthetic flower lamp",
      "Warm handcrafted room ornament or shelf styling focal point"
    ],
    whyBuy: [
      "Stunning infinity reflection effect creating endless glowing tulip rows",
      "Clever 2-in-1 design serving as a high-quality mirror when turned off",
      "Cozy warm aesthetic vibe perfect for gifting and bedroom styling"
    ],
    faqs: [
      {
        question: "What does the infinity bloom lamp look like when turned off?",
        answer: "When switched off, the cube sides become highly reflective mirrors, making it a stylish desktop mirror."
      },
      {
        question: "Are the tulips inside real flowers?",
        answer: "No, they are high-quality, handcrafted artificial tulips that are lit from below by durable warm LEDs to glow indefinitely."
      },
      {
        question: "How is it powered?",
        answer: "It is powered via USB, allowing you to easily connect it to standard chargers, adapters, or power banks."
      }
    ]
  }
};
