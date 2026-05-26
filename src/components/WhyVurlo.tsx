import { ShieldCheck, Truck, Rocket } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Premium Quality", desc: "Aerospace-grade materials and rigorous QA on every unit shipped." },
  { icon: Truck, title: "Fast Delivery", desc: "Carbon-neutral 48-hour shipping to your door, worldwide." },
  { icon: Rocket, title: "Future-Ready", desc: "Modular, upgradable hardware built to evolve with tomorrow." },
];

export function WhyVurlo() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <p className="text-sm text-secondary font-medium mb-2">Why VURLO</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">A new standard for premium tech.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center mb-6 glow-brand">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
