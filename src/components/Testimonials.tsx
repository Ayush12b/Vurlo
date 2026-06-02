import { Star } from "lucide-react";

const reviews = [
  {
    name: "Aarav Mehta",
    role: "Gaming Content Creator",
    text: "The Vurlo Aura RGB LED strip lights completely transformed my streaming room. The colors are incredibly vibrant, and the remote control makes it seamless to change the vibe instantly.",
  },
  {
    name: "Sanya Sen",
    role: "Interior Stylist",
    text: "I bought the Humidifier Lamp and the Crystal Lamp for my bedroom. The ambient glow is so soft and warm, it makes my nighttime routine feel like a premium spa experience.",
  },
  {
    name: "Karan Johar",
    role: "Setup Architect",
    text: "Vurlo's Moon Lamp is a masterpiece of decor. The texture is hyper-realistic and the dual-tone light sets the perfect mood for my late-night desk work.",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12">
        <p className="text-sm text-secondary font-medium mb-2">Transform Your Space</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">See how VURLO lights elevate rooms and moods.</h2>
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
