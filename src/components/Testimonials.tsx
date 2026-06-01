import { Star } from "lucide-react";

const reviews = [
  {
    name: "Alex Chen",
    role: "Product Designer",
    text: "The audio quality is incredibly crisp and the memory foam ear cups make it easy to wear for 6+ hours at my desk.",
  },
  {
    name: "Mira Patel",
    role: "Software Engineer",
    text: "Clean profile, matte black finish, and stable wireless charging. Easily the best addition to my workspace this year.",
  },
  {
    name: "Jordan Lee",
    role: "Content Creator",
    text: "Tactile buttons, premium weights, and solid packaging. You can tell they really obsessed over the product details.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12">
        <p className="text-sm text-secondary font-medium mb-2">Customer Setup Reviews</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">What creators are saying.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <figure key={r.name} className="rounded-2xl border border-border bg-card p-8">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
              ))}
            </div>
            <blockquote className="text-foreground/90 leading-relaxed">"{r.text}"</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-brand" />
              <div>
                <div className="font-medium text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
