import { Cpu, Headphones, Watch, Zap } from "lucide-react";

const cats = [
  { name: "Gadgets", count: 42, icon: Cpu },
  { name: "Audio", count: 28, icon: Headphones },
  { name: "Wearables", count: 16, icon: Watch },
  { name: "Smart Devices", count: 33, icon: Zap },
];

export function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12">
        <p className="text-sm text-secondary font-medium mb-2">Categories</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">Shop by collection.</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cats.map(({ name, count, icon: Icon }) => (
          <a key={name} href="#" className="card-glow-hover group rounded-2xl border border-border bg-card p-8">
            <div className="h-12 w-12 rounded-xl bg-background grid place-items-center mb-6 group-hover:bg-gradient-brand transition-colors">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{count} products</p>
          </a>
        ))}
      </div>
    </section>
  );
}
