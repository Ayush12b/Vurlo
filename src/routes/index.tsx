import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Categories } from "@/components/Categories";
import { WhyVurlo } from "@/components/WhyVurlo";
import { Testimonials } from "@/components/Testimonials";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "VURLO - Built for What's Next" },
      {
        name: "description",
        content: "Premium tech. Clean design. Future-ready essentials from VURLO.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground page-transition">
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <Categories />
      <WhyVurlo />
      <Testimonials />
      <Newsletter />
      <Footer />
    </main>
  );
}
