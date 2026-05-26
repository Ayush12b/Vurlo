import { ArrowRight } from "lucide-react";
import { useHeroParallax, useMagnetic } from "@/hooks/use-premium-interactions";
import heroProduct from "@/assets/hero-product.jpg";

export function Hero() {
  const hero = useHeroParallax<HTMLElement>();
  const primaryCta = useMagnetic<HTMLAnchorElement>({ strength: 7, scale: 1.045 });
  const secondaryCta = useMagnetic<HTMLAnchorElement>({ strength: 5, scale: 1.025 });

  return (
    <section
      ref={hero.ref}
      className="relative overflow-hidden bg-gradient-to-br from-black via-[#0a0a1f] to-[#050507]"
      onPointerMove={hero.onPointerMove}
      onPointerLeave={hero.onPointerLeave}
    >
      <div className="hero-ambient-primary absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-purple-600 blur-[140px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      <div className="hero-ambient-secondary absolute top-1/3 left-2/3 w-[500px] h-[500px] bg-cyan-500 blur-[120px] rounded-full" />

      <div
        className="hero-grid-parallax absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-8 md:px-20 pt-14 pb-24 md:pt-20 grid md:grid-cols-2 gap-14 md:gap-20 items-center">
        <div className="space-y-10">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs tracking-widest text-white/70 uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            New Collection &middot; 2026
          </div>

          <h1
            className="font-display leading-[1.02] tracking-tight"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)", fontWeight: 800 }}
          >
            <span className="block text-white/90">Built for</span>
            <span className="block text-white/90">What's</span>
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(110deg, #a78bfa 0%, #6366f1 50%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Next.
            </span>
          </h1>

          <p className="text-lg leading-relaxed text-white/60 max-w-md font-light tracking-wide">
            Premium tech. Clean design. Future-ready essentials,
            engineered for the people building tomorrow.
          </p>

          <div className="flex items-center gap-6 pt-4">
            <a
              ref={primaryCta.ref}
              href="#shop"
              className="premium-hero-cta group relative inline-flex items-center gap-2.5 rounded-full px-9 py-4 text-sm font-semibold text-white overflow-hidden transition-transform duration-300"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
                boxShadow:
                  "0 0 0 1px rgba(139,92,246,0.3), 0 10px 40px rgba(109,40,217,0.5)",
              }}
              onPointerMove={primaryCta.onPointerMove}
              onPointerLeave={primaryCta.onPointerLeave}
            >
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.25),transparent_70%)]" />
              <span className="relative">Shop Now</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>

            <a
              ref={secondaryCta.ref}
              href="#categories"
              className="premium-text-link text-sm text-white/50 hover:text-white transition"
              onPointerMove={secondaryCta.onPointerMove}
              onPointerLeave={secondaryCta.onPointerLeave}
            >
              Explore &gt;
            </a>
          </div>

          <div className="flex gap-12 pt-6 border-t border-white/[0.08]">
            {[
              ["120k+", "Customers"],
              ["4.9 stars", "Rated"],
              ["48h", "Delivery"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-2xl font-semibold text-white/90">{n}</div>
                <div className="text-xs text-white/50 uppercase tracking-widest">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center items-center">
          <div className="hero-product-glow absolute w-[70%] h-[70%] bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 opacity-50 blur-[120px] rounded-full" />

          <img
            src={heroProduct}
            alt="VURLO product"
            className="hero-product-premium relative w-[460px] md:w-[650px] object-contain mix-blend-lighten select-none"
            style={{
              filter:
                "drop-shadow(0 60px 100px rgba(109,40,217,0.6)) drop-shadow(0 20px 40px rgba(0,0,0,0.8))",
            }}
          />
        </div>
      </div>

      <style>{`
        .hero-grid-parallax {
          transform: translate3d(var(--hero-grid-x, 0px), var(--hero-grid-y, 0px), 0);
          transition: transform 0.16s ease-out;
          will-change: transform;
        }

        .hero-ambient-primary {
          transform: translate3d(calc(-50% + var(--hero-glow-x, 0px)), calc(-50% + var(--hero-glow-y, 0px)), 0);
          opacity: 0.18;
          animation: heroGlow1 22s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-ambient-secondary {
          transform: translate3d(calc(var(--hero-glow-x, 0px) * -0.45), calc(var(--hero-glow-y, 0px) * -0.35), 0);
          opacity: 0.10;
          animation: heroGlow2 30s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .hero-product-glow {
          transform: translate3d(calc(var(--hero-glow-x, 0px) * -0.45), calc(var(--hero-glow-y, 0px) * -0.35), 0);
          transition: transform 0.18s ease-out;
          will-change: transform;
        }

        .hero-product-premium {
          animation: premiumFloat 6s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes heroGlow1 {
          0%, 100% {
            transform: translate3d(calc(-50% + var(--hero-glow-x, 0px)), calc(-50% + var(--hero-glow-y, 0px)), 0) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translate3d(calc(-50% + var(--hero-glow-x, 0px) + 12px), calc(-50% + var(--hero-glow-y, 0px) - 9px), 0) scale(1.03);
            opacity: 0.20;
          }
        }

        @keyframes heroGlow2 {
          0%, 100% {
            transform: translate3d(calc(var(--hero-glow-x, 0px) * -0.45), calc(var(--hero-glow-y, 0px) * -0.35), 0) scale(1);
            opacity: 0.08;
          }
          50% {
            transform: translate3d(calc(var(--hero-glow-x, 0px) * -0.45 - 9px), calc(var(--hero-glow-y, 0px) * -0.35 + 12px), 0) scale(0.96);
            opacity: 0.12;
          }
        }

        .premium-hero-cta,
        .premium-text-link {
          will-change: transform;
        }

        .premium-hero-cta:hover {
          box-shadow:
            0 0 0 1px rgba(139,92,246,0.34),
            0 14px 46px rgba(109,40,217,0.58),
            0 0 38px rgba(34,211,238,0.2) !important;
        }

        @keyframes premiumFloat {
          0%, 100% {
            transform: translate3d(var(--hero-product-x, 0px), var(--hero-product-y, 0px), 0) scale(1.18);
          }
          50% {
            transform: translate3d(var(--hero-product-x, 0px), calc(var(--hero-product-y, 0px) - 22px), 0) scale(1.18);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-product-premium {
            animation: none;
            transform: scale(1.18);
          }
        }
      `}</style>
    </section>
  );
}