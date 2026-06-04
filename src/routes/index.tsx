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
              Upgrade your space with the best RGB lights in India designed for modern rooms, gaming setups, and aesthetic interiors. Whether you're creating a cozy bedroom vibe or a high-energy gaming setup, the right lighting can completely transform your environment. Our collection of aesthetic lighting solutions includes ambient lamps, projection lights, and RGB strips that add depth, color, and mood to any space. Perfect for content creators, gamers, and anyone who wants their room to stand out, these lights are easy to set up and built for everyday use. If you're looking for affordable and stylish gaming setup lights in India, Vurlo offers options that combine performance with design. Create your perfect vibe with lighting that actually makes a difference.
            </p>
          </div>

          {/* Article 2: How to Create an Aesthetic Room Setup */}
          <div className="space-y-4 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.01] backdrop-blur-sm relative overflow-hidden group hover:border-cyan-500/25 transition-all duration-300">
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all duration-300" />
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              How to Create an Aesthetic Room Setup
            </h2>
            <p className="text-xs text-white/50 leading-relaxed">
              Creating an aesthetic room setup is all about combining lighting, layout, and mood. Start with ambient lighting like RGB lamps or projection lights to set the tone of your space. Use warm or colorful lighting to highlight key areas such as your desk, bed, or wall decor. Keep your setup clean and minimal, adding only elements that enhance the vibe. For gaming setups, RGB lights can add depth and energy, while softer lighting works best for relaxation. Layer your lighting by mixing different sources to avoid harsh shadows. Small details like positioning and color choice can make a huge difference in how your room feels.
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </main>
  );
}
