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
      { title: "Vurlo - Premium Workspace Tools & Ergonomic Accessories" },
      {
        name: "description",
        content:
          "Elevate your daily setup with premium workspace tools, ergonomics, and audio accessories designed for focused work.",
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
