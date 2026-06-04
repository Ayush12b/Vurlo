import { Sparkles, Lamp, Bed, Gamepad2, Palette } from "lucide-react";
import { Link } from "@tanstack/react-router";

const cats = [
  { name: "RGB Lights", icon: Sparkles },
  { name: "Ambient Lamps", icon: Lamp },
  { name: "Bedroom Lighting", icon: Bed },
  { name: "Gaming Setup Lights", icon: Gamepad2 },
  { name: "Aesthetic Decor", icon: Palette },
];

export function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12">
        <p className="text-sm text-secondary font-medium mb-2">Categories</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">Shop by collection</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {cats.map(({ name, icon: Icon }) => (
          <Link
            key={name}
            to="/search"
            search={{ category: name }}
            className="card-glow-hover group rounded-2xl border border-border bg-card p-8"
          >
            <div className="h-12 w-12 rounded-xl bg-background grid place-items-center mb-6 group-hover:bg-gradient-brand transition-colors">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-semibold">{name}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
