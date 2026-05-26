import { Instagram, Twitter, Youtube, Github } from "lucide-react";

const cols = [
  { title: "Shop", links: ["All Products", "New Arrivals", "Bestsellers", "Sale"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Support", links: ["Shipping", "Returns", "Warranty", "FAQ"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <a href="#" className="font-display text-2xl font-bold">
            VU<span className="text-gradient-brand">RLO</span>
          </a>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Premium tech. Clean design. Future-ready essentials.
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Twitter, Youtube, Github].map((Icon, i) => (
              <a key={i} href="#" className="h-9 w-9 rounded-lg border border-border grid place-items-center hover:border-primary hover:text-primary transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="font-display font-semibold mb-4">{c.title}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {c.links.map((l) => (
                <li key={l}><a href="#" className="hover:text-foreground transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 VURLO. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
