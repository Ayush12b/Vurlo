import { Instagram, Twitter, Youtube, Github, ShieldCheck, Truck, Award } from "lucide-react";
import { Link } from "@tanstack/react-router";

const cols = [
  { title: "Shop", links: ["All Products", "New Arrivals", "Bestsellers", "Sale"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Support", links: ["Shipping", "Returns", "Warranty", "FAQ"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border mt-12 bg-black/[0.02]">
      {/* Trust Elements Bar */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 sm:gap-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4.5 w-4.5 text-violet-400" />
              <span>Secure Checkout</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <Truck className="h-4.5 w-4.5 text-cyan-400" />
              <span>Fast Delivery</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <Award className="h-4.5 w-4.5 text-indigo-400" />
              <span>Premium Quality</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground/60 flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] px-4 py-2 rounded-full backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Trusted by 100+ customers
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <Link to="/" className="font-display text-2xl font-bold">
            VU<span className="text-gradient-brand">RLO</span>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Premium tech. Clean design. Future-ready essentials.
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Twitter, Youtube, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="h-9 w-9 rounded-lg border border-border grid place-items-center hover:border-primary hover:text-primary transition-colors"
              >
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
                <li key={l}>
                  <a href="#" className="hover:text-foreground transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 VURLO. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
