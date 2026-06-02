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
      <Newsletter />
      <Footer />
    </main>
  );
}
