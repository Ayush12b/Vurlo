import { useRef, useState, useEffect } from "react";
import { ShoppingBag, ArrowUpRight, Sparkles, Search, Loader2 } from "lucide-react";
import { usePremiumTilt, useScrollReveal, useMagnetic } from "@/hooks/use-premium-interactions";
import { useCart } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

const localImages: Record<string, string> = {
  "product-1.jpg": p1,
  "product-2.jpg": p2,
  "product-3.jpg": p3,
  "product-4.jpg": p4,
  "/src/assets/product-1.jpg": p1,
  "/src/assets/product-2.jpg": p2,
  "/src/assets/product-3.jpg": p3,
  "/src/assets/product-4.jpg": p4,
  "/assets/product-1.jpg": p1,
  "/assets/product-2.jpg": p2,
  "/assets/product-3.jpg": p3,
  "/assets/product-4.jpg": p4,
  "/product-1.jpg": p1,
  "/product-2.jpg": p2,
  "/product-3.jpg": p3,
  "/product-4.jpg": p4,
};

const FALLBACKS = {
  earbuds:
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  charger:
    "https://images.unsplash.com/photo-1622445262465-2481c4574875?w=600&auto=format&fit=crop&q=80",
  vacuum:
    "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&auto=format&fit=crop&q=80",
  default:
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
};

export function getProductSpecificFallback(productName?: string): string {
  if (!productName) return FALLBACKS.default;
  const nameLower = productName.toLowerCase();

  if (
    nameLower.includes("earbud") ||
    nameLower.includes("earbuds") ||
    nameLower.includes("buds") ||
    nameLower.includes("headphone") ||
    nameLower.includes("audio")
  ) {
    return FALLBACKS.earbuds;
  }
  if (
    nameLower.includes("charging pad") ||
    nameLower.includes("charger") ||
    nameLower.includes("pad") ||
    nameLower.includes("charging") ||
    nameLower.includes("power bank")
  ) {
    return FALLBACKS.charger;
  }
  if (
    nameLower.includes("vacuum") ||
    nameLower.includes("cleaner") ||
    nameLower.includes("sweep")
  ) {
    return FALLBACKS.vacuum;
  }
  return FALLBACKS.default;
}

export function resolveProductImage(path: string | undefined, productName?: string): string {
  const fallback = getProductSpecificFallback(productName);

  if (!path || path.trim() === "") {
    return fallback;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleaned = path.trim();
  if (localImages[cleaned]) {
    return localImages[cleaned];
  }

  const filename = cleaned.split("/").pop();
  if (filename && localImages[filename]) {
    return localImages[filename];
  }

  if (path.startsWith("/")) {
    return path;
  }

  return fallback;
}

const formatPrice = (price: number | string) => {
  const num = typeof price === "number" ? price : parseFloat(String(price));
  if (isNaN(num)) return String(price);
  return new Intl.NumberFormat("en-IN").format(num);
};

interface FirestoreProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  tag?: string | null;
  accent?: string;
  accentRgb?: string;
}

const ACCENT_PALETTES = [
  { accent: "#22d3ee", accentRgb: "34,211,238" }, // Cyan
  { accent: "#a78bfa", accentRgb: "167,139,250" }, // Violet
  { accent: "#34d399", accentRgb: "52,211,153" }, // Emerald
  { accent: "#fb923c", accentRgb: "251,146,60" }, // Orange
];

export function FeaturedProducts() {
  const headingRef = useRef<HTMLDivElement>(null);
  useScrollReveal(headingRef, 0);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dbProducts, isLoading } = useQuery<FirestoreProduct[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          price: data.price ?? 0,
          image: data.image || "",
          tag: data.tag || null,
          accent: data.accent,
          accentRgb: data.accentRgb,
        };
      });
    },
  });

  const filteredProducts = dbProducts?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <section
      id="shop"
      className="relative mx-auto max-w-7xl scroll-mt-28 px-5 py-16 sm:px-6 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
      </div>

      <div
        ref={headingRef}
        className="mb-12 flex items-end justify-between gap-6 md:mb-16 reveal-fade-in"
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/50">
              Featured Collection
            </span>
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white/90 leading-[1.05] sm:text-5xl md:text-6xl">
            Engineered
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              to stand out.
            </span>
          </h2>
        </div>
        <a
          href="#"
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors duration-300 group"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>

      {/* Premium Search Bar */}
      <div
        className="mb-10 max-w-md reveal-fade-in"
        style={{ "--reveal-delay": "100ms" } as React.CSSProperties}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/40 text-white rounded-xl placeholder:text-white/20 h-10 pl-10 pr-10 text-xs tracking-wide focus:outline-none transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/40 hover:text-white/80 transition-colors duration-200 px-1 cursor-pointer focus:outline-none"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} index={i} />)
          : filteredProducts?.map((p, i) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  img: p.image,
                  tag: p.tag || null,
                  accent: p.accent || ACCENT_PALETTES[i % ACCENT_PALETTES.length].accent,
                  accentRgb: p.accentRgb || ACCENT_PALETTES[i % ACCENT_PALETTES.length].accentRgb,
                }}
                index={i}
              />
            ))}
        {!isLoading && (!dbProducts || dbProducts.length === 0) && (
          <div className="col-span-full py-12 text-center text-white/40">No products found.</div>
        )}
        {!isLoading &&
          dbProducts &&
          dbProducts.length > 0 &&
          filteredProducts &&
          filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-white/35 flex flex-col items-center justify-center gap-3 border border-white/[0.04] bg-white/[0.01] rounded-2xl">
              <Search className="h-6 w-6 text-white/20" />
              <div>
                <p className="text-sm font-semibold text-white/60">No products match your search</p>
                <p className="text-xs text-white/35 mt-1">
                  Try looking for different keywords or clear the filter.
                </p>
              </div>
            </div>
          )}
      </div>

      <style>{STYLES}</style>
    </section>
  );
}

function ProductCardSkeleton({ index }: { index: number }) {
  const palette = ACCENT_PALETTES[index % ACCENT_PALETTES.length];

  return (
    <div
      className="pcard"
      style={
        {
          "--accent": palette.accent,
          "--accent-rgb": palette.accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="pcard__ring" style={{ opacity: 0.3 }} />
      <div className="pcard__float-zone">
        <Skeleton className="w-full h-full bg-white/[0.03]" />
      </div>
      <div className="pcard__body">
        <div className="pcard__sep" style={{ transform: "scaleX(1)" }} />
        <div className="flex items-start justify-between gap-3 pt-5 pb-5 px-5">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-1/3 bg-white/10" />
          </div>
          <div className="pcard__cart opacity-50 pointer-events-none">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number | string;
    img: string;
    tag: string | null;
    accent: string;
    accentRgb: string;
  };
  index: number;
}

function ProductCard({ product: p, index }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const tilt = usePremiumTilt<HTMLElement, HTMLImageElement, HTMLDivElement>({
    rotateX: 6,
    rotateY: 8,
    depth: 15,
  });
  const viewBtn = useMagnetic<HTMLButtonElement>({ strength: 3, scale: 1.01 });
  const cartBtn = useMagnetic<HTMLButtonElement>({ strength: 3, scale: 1.02 });
  const { addToCart } = useCart();

  const [imgSrc, setImgSrc] = useState(() => resolveProductImage(p.img, p.name));

  useEffect(() => {
    setImgSrc(resolveProductImage(p.img, p.name));
  }, [p.img, p.name]);

  useScrollReveal(tilt.cardRef, index * 100);

  return (
    <article
      ref={tilt.cardRef}
      className="pcard group reveal-fade-in"
      onPointerEnter={tilt.onPointerEnter}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      style={
        {
          "--accent": p.accent,
          "--accent-rgb": p.accentRgb,
        } as React.CSSProperties
      }
    >
      <div ref={tilt.lightRef} className="pcard__light" />
      <div className="pcard__ring" />

      <div className="pcard__float-zone">
        <img
          ref={tilt.depthRef}
          src={imgSrc}
          alt={p.name}
          className="pcard__img"
          onError={() => setImgSrc(getProductSpecificFallback(p.name))}
        />
        <div className="pcard__img-glow" />

        {p.tag && <span className="pcard__tag">{p.tag}</span>}

        <div className="pcard__hover-cta">
          <button
            ref={viewBtn.ref}
            className="pcard__view-btn"
            onPointerMove={viewBtn.onPointerMove}
            onPointerLeave={viewBtn.onPointerLeave}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Quick View
          </button>
        </div>
      </div>

      <div className="pcard__body">
        <div className="pcard__sep" />

        <div className="flex items-start justify-between gap-3 pt-5 pb-5 px-5">
          <div>
            <p className="pcard__name">{p.name}</p>
            <p className="pcard__price">₹{formatPrice(p.price)}</p>
          </div>
          <button
            ref={cartBtn.ref}
            className={`pcard__cart ${adding ? "opacity-50 pointer-events-none" : ""}`}
            aria-label="Add to cart"
            disabled={adding}
            onPointerMove={cartBtn.onPointerMove}
            onPointerLeave={cartBtn.onPointerLeave}
            onClick={async (e) => {
              e.stopPropagation();
              if (adding) return;
              setAdding(true);
              try {
                await addToCart({
                  productId: p.id,
                  name: p.name,
                  price: typeof p.price === "number" ? p.price : parseFloat(String(p.price)) || 0,
                  image: p.img,
                });
              } finally {
                setAdding(false);
              }
            }}
          >
            {adding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

const STYLES = `
  .pcard {
    --tilt-rx: 0deg;
    --tilt-ry: 0deg;
    --shadow-x: 0px;
    --shadow-y: 30px;
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 22px;
    background: linear-gradient(175deg, #0f0f18 0%, #090910 100%);
    border: 1px solid rgba(255,255,255,0.06);
    min-width: 0;
    cursor: pointer;
    isolation: isolate;
    overflow: hidden;
    transform: perspective(1000px) rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry));
    transform-style: preserve-3d;
    transition:
      box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      border-color 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
  }

  .pcard__light {
    position: absolute;
    top: -150px;
    left: -150px;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(
      circle 120px at center,
      rgba(var(--accent-rgb), 0.12) 0%,
      transparent 80%
    );
    pointer-events: none;
    z-index: 5;
    opacity: 0;
    will-change: transform, opacity;
    transform-style: preserve-3d;
  }

  .pcard:hover {
    border-color: rgba(var(--accent-rgb), 0.28);
    box-shadow:
      0 0 0 1px rgba(var(--accent-rgb), 0.15),
      var(--shadow-x, 0px) var(--shadow-y, 30px) 80px -16px rgba(0,0,0,0.85),
      0 0 80px -20px rgba(var(--accent-rgb), 0.22);
  }

  .pcard__ring {
    position: absolute;
    inset: -1px;
    border-radius: 23px;
    background: radial-gradient(ellipse at top, rgba(var(--accent-rgb), 0.12), transparent 65%);
    opacity: 0;
    transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 0;
  }

  .pcard:hover .pcard__ring { opacity: 1; }

  .pcard__float-zone {
    position: relative;
    height: clamp(250px, 22vw, 300px);
    overflow: hidden;
    z-index: 2;
    transform: translateZ(18px);
    transform-style: preserve-3d;
    will-change: transform;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .pcard:nth-child(1) .pcard__float-zone { animation: cardFloat 12s ease-in-out infinite; }
  .pcard:nth-child(2) .pcard__float-zone { animation: cardFloat 12s ease-in-out infinite -3s; }
  .pcard:nth-child(3) .pcard__float-zone { animation: cardFloat 12s ease-in-out infinite -6s; }
  .pcard:nth-child(4) .pcard__float-zone { animation: cardFloat 12s ease-in-out infinite -9s; }

  @keyframes cardFloat {
    0%, 100% {
      transform: translateZ(18px) translateY(0px) scale(1);
    }
    50% {
      transform: translateZ(18px) translateY(-3px) scale(1.006);
    }
  }

  .pcard__img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
    object-position: center;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translate3d(0px, 0px, 24px) scale(1);
    transform-origin: center;
    will-change: transform;
  }

  .pcard:hover .pcard__img {
    transform: translate3d(0px, 0px, 32px) scale(1.08);
  }

  .pcard__img-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%);
    opacity: var(--img-light-opacity, 0);
    pointer-events: none;
    z-index: 3;
    transform: translateZ(33px);
    will-change: opacity;
  }

  .pcard__tag {
    position: absolute;
    top: 18px;
    left: 16px;
    z-index: 5;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.13em;
    color: var(--accent);
    background: rgba(var(--accent-rgb), 0.1);
    border: 1px solid rgba(var(--accent-rgb), 0.3);
    padding: 3px 9px;
    border-radius: 999px;
    backdrop-filter: blur(8px);
  }

  .pcard__hover-cta {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 12px;
    z-index: 6;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pcard:hover .pcard__hover-cta {
    opacity: 1;
    transform: translateY(0);
  }

  .pcard__view-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 16px;
    border-radius: 999px;
    background: rgba(var(--accent-rgb), 0.12);
    border: 1px solid rgba(var(--accent-rgb), 0.35);
    color: var(--accent);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    backdrop-filter: blur(12px);
    transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pcard__view-btn:hover {
    background: rgba(var(--accent-rgb), 0.22);
    box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3);
  }

  .pcard__body {
    position: relative;
    z-index: 2;
    border-radius: 0 0 22px 22px;
    background: linear-gradient(180deg, rgba(255,255,255,0.025) 0%, transparent 100%);
    transform: translateZ(14px);
  }

  .pcard__sep {
    height: 1px;
    margin: 0 16px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--accent-rgb), 0.25) 40%,
      rgba(var(--accent-rgb), 0.25) 60%,
      transparent
    );
    transform: scaleX(0.4);
    transform-origin: left;
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pcard:hover .pcard__sep { transform: scaleX(1); }

  .pcard__name {
    font-size: 14.5px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.92);
    letter-spacing: -0.015em;
    line-height: 1.3;
  }

  .pcard__price {
    margin-top: 5px;
    font-size: 15px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.01em;
  }

  .pcard__cart {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--accent-rgb), 0.07);
    border: 1px solid rgba(var(--accent-rgb), 0.18);
    color: var(--accent);
    transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pcard__cart:hover {
    background: rgba(var(--accent-rgb), 0.18);
    box-shadow: 0 0 16px rgba(var(--accent-rgb), 0.25);
    transform: scale(1.1);
  }

  .pcard::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 22px;
    background: linear-gradient(
      110deg,
      transparent 30%,
      rgba(255,255,255,0.055) 50%,
      transparent 70%
    );
    background-size: 200% 100%;
    background-position: -100% 0;
    transition: background-position 0.65s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 4;
  }

  .pcard:hover::after {
    background-position: 200% 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .pcard,
    .pcard__img {
      transition-duration: 0.01ms;
      transform: none !important;
    }
  }
`;
