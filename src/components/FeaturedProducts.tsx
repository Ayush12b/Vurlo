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

function getProductSpecificFallback(productName?: string): string {
  if (!productName) return FALLBACKS.default;
  const nameLower = productName.toLowerCase();
  if (nameLower.includes("earbud") || nameLower.includes("earbuds") || nameLower.includes("buds") || nameLower.includes("headphone") || nameLower.includes("audio")) return FALLBACKS.earbuds;
  if (nameLower.includes("charging pad") || nameLower.includes("charger") || nameLower.includes("pad") || nameLower.includes("charging") || nameLower.includes("power bank")) return FALLBACKS.charger;
  if (nameLower.includes("vacuum") || nameLower.includes("cleaner") || nameLower.includes("sweep")) return FALLBACKS.vacuum;
  return FALLBACKS.default;
}

export function resolveProductImage(path: string | undefined, productName?: string): string {
  const fallback = getProductSpecificFallback(productName);
  if (!path || path.trim() === "") return fallback;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleaned = path.trim();
  if (localImages[cleaned]) return localImages[cleaned];
  const filename = cleaned.split("/").pop();
  if (filename && localImages[filename]) return localImages[filename];
  if (path.startsWith("/")) return path;
  return fallback;
}

const formatPrice = (price: number | string) => {
  const num = typeof price === "number" ? price : parseFloat(String(price));
  if (isNaN(num)) return String(price);
  return new Intl.NumberFormat("en-IN").format(num);
};

const IMAGE_ADJUSTMENTS: Record<string, { scale: number; objectPosition: string }> = {
  "product-1.jpg": { scale: 1.85, objectPosition: "56% 48%" },   // headphones: push harder, shift right-center
  "product-2.jpg": { scale: 1.60, objectPosition: "50% 58%" },   // charging pad: fill edges, anchor lower
  "product-3.jpg": { scale: 1.20, objectPosition: "44% 56%" },   // watch: pull back, anchor lower so face shows
  "product-4.jpg": { scale: 1.35, objectPosition: "50% 50%" },
};

const getFilename = (path: string | undefined): string => {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || "";
};

const getAdjustmentStyle = (path: string | undefined): React.CSSProperties => {
  const filename = getFilename(path);
  const adj = IMAGE_ADJUSTMENTS[filename];

  const makeStyle = (s: number, pos: string): React.CSSProperties => ({
    transform: `scale(${s})`,
    transformOrigin: "center center",
    objectPosition: pos,
    objectFit: "cover" as const,
    width: "100%",
    height: "100%",
    position: "absolute" as const,
    top: 0,
    left: 0,
  });

  if (adj) return makeStyle(adj.scale, adj.objectPosition);

  const pathLower = path?.toLowerCase() || "";
  if (pathLower.includes("1590658268037")) return makeStyle(1.85, "56% 48%");
  if (pathLower.includes("1622445262465")) return makeStyle(1.60, "50% 58%");
  if (pathLower.includes("1558317374"))    return makeStyle(1.20, "44% 56%");

  return makeStyle(1.0, "center");
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
  { accent: "#22d3ee", accentRgb: "34,211,238" },
  { accent: "#a78bfa", accentRgb: "167,139,250" },
  { accent: "#34d399", accentRgb: "52,211,153" },
  { accent: "#fb923c", accentRgb: "251,146,60" },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} index={i} />)
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
      className="pcard flex flex-col h-full p-5"
      style={
        {
          "--accent": palette.accent,
          "--accent-rgb": palette.accentRgb,
        } as React.CSSProperties
      }
    >
      <div className="pcard__ring" style={{ opacity: 0.3 }} />
      <div className="pcard__float-zone relative w-full h-56 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <Skeleton className="absolute inset-0 w-full h-full bg-white/[0.03]" />
      </div>
      <div className="pcard__body flex flex-col flex-1 mt-4">
        <div className="pcard__sep mb-4" style={{ transform: "scaleX(1)" }} />
        <div className="flex flex-col flex-1">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-3/4 bg-white/10" />
          </div>
          <div className="mt-auto flex items-center justify-between">
            <Skeleton className="h-4 w-1/3 bg-white/10" />
            <div className="pcard__cart opacity-50 pointer-events-none">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
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
      className="pcard group reveal-fade-in flex flex-col h-full p-5"
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

      {/* Ambient glow orb behind image */}
      <div className="pcard__img-orb" />

      <div className="pcard__float-zone relative w-full h-56 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <img
          ref={tilt.depthRef}
          src={imgSrc}
          alt={p.name}
          className="pcard__img absolute inset-0 w-full h-full object-cover"
          style={getAdjustmentStyle(p.img)}
          onError={() => setImgSrc(getProductSpecificFallback(p.name))}
        />

        {/* Vignette overlay for depth */}
        <div className="pcard__vignette" />
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

      <div className="pcard__body flex flex-col flex-1 mt-4">
        <div className="pcard__sep mb-4" />

        <div className="flex flex-col flex-1">
          <p className="pcard__name mb-4">{p.name}</p>
          <div className="mt-auto flex items-center justify-between">
            <p className="pcard__price">₹{formatPrice(p.price)}</p>
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
      </div>
    </article>
  );
}

const STYLES = `
  .pcard {
    --tilt-rx: 0deg;
    --tilt-ry: 0deg;
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    background: linear-gradient(170deg, #0d0d1c 0%, #070710 100%);
    border: 1px solid rgba(255,255,255,0.065);
    isolation: isolate;
    overflow: hidden;
    transform: perspective(1000px) rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry)) translateY(0px);
    transform-style: preserve-3d;
    transition:
      box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      border-color 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
      transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
    height: 100%;
    box-shadow:
      0 2px 16px rgba(0,0,0,0.4),
      0 1px 0 rgba(255,255,255,0.035) inset;
    cursor: pointer;
  }

  .pcard:hover {
    border-color: rgba(var(--accent-rgb), 0.28);
    transform: perspective(1000px) rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry)) translateY(-5px);
    box-shadow:
      0 0 0 1px rgba(var(--accent-rgb), 0.14),
      0 24px 48px -12px rgba(0,0,0,0.7),
      0 0 60px -20px rgba(var(--accent-rgb), 0.22),
      0 1px 0 rgba(255,255,255,0.05) inset;
  }

  /* ── Ambient orb glow behind the image ── */
  .pcard__img-orb {
    position: absolute;
    top: -8%;
    left: 50%;
    transform: translateX(-50%);
    width: 65%;
    height: 160px;
    border-radius: 50%;
    background: radial-gradient(
      ellipse at center,
      rgba(var(--accent-rgb), 0.12) 0%,
      rgba(var(--accent-rgb), 0.04) 50%,
      transparent 75%
    );
    filter: blur(24px);
    pointer-events: none;
    z-index: 1;
    opacity: 0.6;
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .pcard:hover .pcard__img-orb {
    opacity: 0.9;
    transform: translateX(-50%) scaleX(1.1) scaleY(1.08);
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
      rgba(var(--accent-rgb), 0.14) 0%,
      transparent 80%
    );
    pointer-events: none;
    z-index: 5;
    opacity: 0;
    will-change: transform, opacity;
    transform-style: preserve-3d;
  }

  .pcard:hover .pcard__light {
    opacity: 1;
  }

  .pcard__ring {
    position: absolute;
    inset: -1px;
    border-radius: 23px;
    background: radial-gradient(ellipse at top, rgba(var(--accent-rgb), 0.14), transparent 65%);
    opacity: 0;
    transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 0;
  }

  .pcard:hover .pcard__ring { opacity: 1; }

  .pcard__float-zone {
    position: relative;
    z-index: 2;
    transform: translateZ(14px);
    transform-style: preserve-3d;
    will-change: transform;
    border-radius: 14px;
    overflow: hidden;
    box-shadow:
      0 6px 24px rgba(0,0,0,0.45),
      0 0 0 1px rgba(255,255,255,0.035);
    transition: box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .pcard:hover .pcard__float-zone {
    box-shadow:
      0 12px 36px rgba(0,0,0,0.55),
      0 0 0 1px rgba(var(--accent-rgb), 0.12),
      0 0 40px -10px rgba(var(--accent-rgb), 0.25);
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
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
    transform-origin: center center;
    will-change: transform, filter;
    filter: brightness(0.92) saturate(1.05) contrast(1.02);
    transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pcard:hover .pcard__img {
    /* Override getAdjustmentStyle scale — bake hover scale into filter approach */
    filter: brightness(1.04) saturate(1.12) contrast(1.0);
  }

  /* Vignette for cinematic depth */
  .pcard__vignette {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background:
      radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%);
    pointer-events: none;
    z-index: 2;
    opacity: 0.7;
    transition: opacity 0.4s ease;
  }

  .pcard:hover .pcard__vignette {
    opacity: 0.45;
  }

  .pcard__img-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.07) 0%,
      transparent 55%,
      rgba(var(--accent-rgb), 0.04) 100%
    );
    opacity: var(--img-light-opacity, 0);
    pointer-events: none;
    z-index: 3;
    transform: translateZ(33px);
    will-change: opacity;
    border-radius: 12px;
    transition: opacity 0.3s ease;
  }

  .pcard:hover .pcard__img-glow {
    opacity: 1;
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
    background: rgba(var(--accent-rgb), 0.12);
    border: 1px solid rgba(var(--accent-rgb), 0.35);
    padding: 3px 9px;
    border-radius: 999px;
    backdrop-filter: blur(10px);
    box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.2);
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
    transform: translateY(6px);
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
    padding: 7px 18px;
    border-radius: 999px;
    background: rgba(var(--accent-rgb), 0.14);
    border: 1px solid rgba(var(--accent-rgb), 0.4);
    color: var(--accent);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    backdrop-filter: blur(16px);
    transition:
      background 0.2s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
      0 2px 12px rgba(var(--accent-rgb), 0.15),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .pcard__view-btn:hover {
    background: rgba(var(--accent-rgb), 0.24);
    box-shadow:
      0 0 24px rgba(var(--accent-rgb), 0.4),
      0 4px 16px rgba(var(--accent-rgb), 0.2),
      inset 0 1px 0 rgba(255,255,255,0.1);
    transform: scale(1.03);
  }

  .pcard__body {
    position: relative;
    z-index: 2;
    transform: translateZ(10px);
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    padding: 4px 2px 2px;
    gap: 0;
  }

  .pcard__sep {
    height: 1px;
    margin: 0 4px 14px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--accent-rgb), 0.22) 40%,
      rgba(var(--accent-rgb), 0.22) 60%,
      transparent
    );
    transform: scaleX(0.5);
    transform-origin: left;
    transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .pcard:hover .pcard__sep {
    transform: scaleX(1);
  }

  .pcard__name {
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.88);
    letter-spacing: -0.01em;
    line-height: 1.35;
    margin-bottom: 12px;
    transition: color 0.2s ease;
  }

  .pcard:hover .pcard__name {
    color: rgba(255, 255, 255, 0.96);
  }

  .pcard__price {
    font-size: 16px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: -0.02em;
    text-shadow: 0 0 16px rgba(var(--accent-rgb), 0.3);
    transition: text-shadow 0.25s ease;
  }

  .pcard:hover .pcard__price {
    text-shadow: 0 0 22px rgba(var(--accent-rgb), 0.55);
  }

  .pcard__cart {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--accent-rgb), 0.06);
    border: 1px solid rgba(var(--accent-rgb), 0.15);
    color: var(--accent);
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
      border-color 0.2s ease;
  }

  .pcard__cart:hover {
    background: rgba(var(--accent-rgb), 0.16);
    border-color: rgba(var(--accent-rgb), 0.36);
    box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.28);
    transform: scale(1.1);
  }

  .pcard::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: linear-gradient(
      115deg,
      transparent 30%,
      rgba(255,255,255,0.03) 50%,
      transparent 70%
    );
    background-size: 200% 100%;
    background-position: -100% 0;
    transition: background-position 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
    z-index: 4;
  }

  .pcard:hover::after {
    background-position: 200% 0;
  }

  /* Glass top-edge highlight */
  .pcard::before {
    content: "";
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.12) 30%,
      rgba(255,255,255,0.18) 50%,
      rgba(255,255,255,0.12) 70%,
      transparent
    );
    border-radius: 22px 22px 0 0;
    pointer-events: none;
    z-index: 5;
    opacity: 0.6;
    transition: opacity 0.35s ease;
  }

  .pcard:hover::before {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .pcard,
    .pcard__img {
      transition-duration: 0.01ms;
      transform: none !important;
      animation: none !important;
    }
  }
`;
