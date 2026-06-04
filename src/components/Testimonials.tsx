import { Star } from "lucide-react";

const reviews = [
  {
    name: "Rohit Sharma",
    role: "College Student, Delhi",
    initials: "RS",
    text: "Got the RGB strip lights for my hostel room and honestly wasn't expecting much at this price. But the colors are actually really good, the app works fine and it sticks properly. My roommates keep asking where I bought it from lol",
  },
  {
    name: "Priya Nair",
    role: "Work from Home, Bangalore",
    initials: "PN",
    text: "Ordered the humidifier lamp mostly for the aesthetic and it looks exactly like the photos. Been using it for 2 months now, no issues. The mist is quiet so it doesn't disturb calls. Happy with the purchase overall.",
  },
  {
    name: "Arjun Verma",
    role: "Gaming Setup, Pune",
    initials: "AV",
    text: "The moon lamp I ordered for my desk is genuinely nice. The glow is warm and not too harsh for late nights. Packaging was also good, came without any damage. Would order again if I need something for gifting.",
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
              <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                {r.initials}
              </div>
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
