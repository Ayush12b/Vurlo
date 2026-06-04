import { ShieldCheck, Truck, Rocket } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Looks Good, Actually",
    desc: "Every product is picked to work in real rooms — not just studio photoshoots. Clean desks, gaming rigs, bedroom corners, it all works.",
  },
  {
    icon: Truck,
    title: "Ships Fast, Packed Well",
    desc: "Orders go out within 48 hours. Packed properly so nothing arrives broken — which, honestly, should be standard but isn't.",
  },
  {
    icon: Rocket,
    title: "Priced to Make Sense",
    desc: "Aesthetic lighting shouldn't cost a fortune. We keep it affordable without making it feel cheap.",
  },
];

export function WhyVurlo() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">
          Why VURLO
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-white/90">
          Why people actually keep coming back.
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 card-glow-hover flex flex-col justify-between"
          >
            <div>
              <div className="relative mb-6 w-12 h-12">
                <div className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,#8a2eff,#00e5ff)] opacity-40 blur-md animate-pulse-glow" />
                <div className="relative h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center text-white">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="font-display text-lg font-bold text-white/95 mb-2">{title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
