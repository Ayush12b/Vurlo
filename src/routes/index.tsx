import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Categories } from "@/components/Categories";
import { WhyVurlo } from "@/components/WhyVurlo";
import { Testimonials } from "@/components/Testimonials";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

type IndexSearchParams = {
  category?: string;
  sale?: boolean;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearchParams => {
    return {
      category: (search.category as string) || undefined,
      sale: (search.sale as boolean) || undefined,
    };
  },
  component: Index,
  head: () => ({
    meta: [
      { title: "Vurlo - Premium Aesthetic Lighting & Room Decor" },
      {
        name: "description",
        content:
          "Upgrade your room and your vibe with Vurlo. Premium ambient lamps, RGB lights, and aesthetic decor designed to elevate your setup's daily atmosphere.",
      },
    ],
  }),
});

function Index() {
  const { category, sale } = Route.useSearch();
  return (
    <main className="min-h-screen bg-background text-foreground page-transition">
      <Navbar />
      <Hero />
      <FeaturedProducts category={category} sale={sale} />
      <Categories />
      <WhyVurlo />
      <Testimonials />

      {/* Homepage SEO Articles */}
      <section className="mx-auto max-w-7xl px-6 py-20 border-t border-white/[0.06] text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Article 1: Best RGB Lights for Rooms in India */}
          <div className="space-y-4 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-sm relative overflow-hidden group hover:border-violet-500/25 transition-all duration-300">
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-violet-500/5 blur-2xl group-hover:bg-violet-500/10 transition-all duration-300" />
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Best RGB Lights for Rooms in India
            </h2>
            <p className="text-xs text-white/50 leading-relaxed">
              Elevate your home aesthetics with premium ambient lighting designed for modern setups. Finding the best RGB lights for rooms in India involves prioritizing color richness, installation flexibility, and smart integrations. Vurlo smart RGB strip lights and ambient projection lamps offer over 16 million colors and customizable dynamic modes to suit any occasion. Whether you are setting up a cozy bedroom sanctuary, lighting up a house party, or backlight-mounting your workspace desk, high-density smart LEDs provide consistent, flicker-free glow. With solid adhesive backing and smart app/remote controls, you can effortlessly customize brightness, sync patterns with your favorite music beats, and upgrade your living environment instantly.
            </p>
          </div>

          {/* Article 2: How to Create an Aesthetic Room Setup */}
          <div className="space-y-4 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/25 transition-all duration-300">
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all duration-300" />
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              How to Create an Aesthetic Room Setup
            </h2>
            <p className="text-xs text-white/50 leading-relaxed">
              Creating a stunning, cozy, and aesthetic room setup requires a thoughtful blend of layered lighting, clean furniture layouts, and curated accent pieces. Start by introducing a primary ambient source, like the Vurlo Orbit Galaxy Projector or Sunset Projection Lamp, to cast soft color washes across your walls and ceilings. Next, layer accent lighting such as 3D laser-engraved crystal ball lamps or smart RGB strips behind screens and under shelves to create visual depth and reduce eye strain. Keep cables managed, focus on neutral or dark-themed accessories, and place a few green plants or modern art frames. By mixing functional task lights with warm decorative glows, you can create a relaxing sanctuary that inspires focus and represents your unique style.
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  );
}
