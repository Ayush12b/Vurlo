import { ShoppingBag, ArrowUpRight, Sparkles } from "lucide-react";
import { usePremiumTilt } from "@/hooks/use-premium-interactions";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

const products = [
  { name: "Aurora Headphones", price: 349, img: p1, tag: "New", accent: "#22d3ee", accentRgb: "34,211,238" },
  { name: "Pulse Smartwatch", price: 289, img: p2, tag: "Hot", accent: "#a78bfa", accentRgb: "167,139,250" },
  { name: "Halo Charging Pad", price: 79, img: p3, tag: null, accent: "#34d399", accentRgb: "52,211,153" },
  { name: "Echo Pro Buds", price: 199, img: p4, tag: "Limited", accent: "#fb923c", accentRgb: "251,146,60" },
];

export function FeaturedProducts() {
  return (
    <section id="shop" className="relative mx-auto max-w-7xl scroll-mt-28 px-5 py-16 sm:px-6 md:py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
      </div>

      <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/50">Featured Collection</span>
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white/90 leading-[1.05] sm:text-5xl md:text-6xl">
            Engineered<br />
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {products.map((p, i) => (
          <ProductCard key={p.name} product={p} index={i} />
        ))}
      </div>

      <style>{STYLES}</style>
    </section>
  );
}

function ProductCard({ product: p }: { product: typeof products[number]; index: number }) {
  const tilt = usePremiumTilt<HTMLArticleElement, HTMLImageElement>({ rotate: 7, depth: 18 });

  return (
    <article
      ref={tilt.cardRef}
      className="pcard group"
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
      <div className="pcard__ring" />

      <div className="pcard__float-zone">
        <img ref={tilt.depthRef} src={p.img} alt={p.name} className="pcard__img" />

        {p.tag && <span className="pcard__tag">{p.tag}</span>}

        <div className="pcard__hover-cta">
          <button
            className="pcard__view-btn"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Quick View
          </button>
        </div>
      </div>

      <div className="pcard__body">
        <div className="pcard__sep" />

        <div className="flex items-start justify-between gap-2 pt-4 pb-3 px-4">
          <div>
            <p className="pcard__name">{p.name}</p>
            <p className="pcard__price">${p.price}</p>
          </div>
          <button
            className="pcard__cart"
            aria-label="Add to cart"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
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
      box-shadow 0.45s cubic-bezier(0.23, 1, 0.32, 1),
      border-color 0.35s ease;
    will-change: transform;
  }

  .pcard:hover {
    border-color: rgba(var(--accent-rgb), 0.28);
    box-shadow:
      0 0 0 1px rgba(var(--accent-rgb), 0.15),
      0 30px 80px -16px rgba(0,0,0,0.85),
      0 0 80px -20px rgba(var(--accent-rgb), 0.35);
  }

  .pcard__ring {
    position: absolute;
    inset: -1px;
    border-radius: 23px;
    background: radial-gradient(ellipse at top, rgba(var(--accent-rgb), 0.18), transparent 65%);
    opacity: 0;
    transition: opacity 0.45s ease;
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
  }

  .pcard__img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
    object-position: center;
    transform: translate3d(0px, 0px, 24px) scale(1.02);
    transform-origin: center;
    filter: none;
    mix-blend-mode: normal;
    will-change: transform;
  }

  .pcard:hover .pcard__img {
    transform: translate3d(0px, 0px, 32px) scale(1.055);
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
    transition: opacity 0.3s ease, transform 0.3s ease;
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
    transition: background 0.2s, box-shadow 0.2s;
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
    transition: transform 0.5s cubic-bezier(0.23,1,0.32,1);
  }

  .pcard:hover .pcard__sep { transform: scaleX(1); }

  .pcard__name {
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.82);
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  .pcard__price {
    margin-top: 3px;
    font-size: 13px;
    font-weight: 700;
    background: linear-gradient(90deg, var(--accent), rgba(255,255,255,0.55));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
    transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
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
    transition: background-position 0.65s ease;
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
      transform: none;
    }
  }
`;