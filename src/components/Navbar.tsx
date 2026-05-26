import { Search, ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";

const links = ["Home", "Shop", "Categories", "Contact"];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .vurlo-navbar {
          font-family: 'DM Sans', sans-serif;
        }

        .vurlo-logo {
          font-family: 'Syne', sans-serif;
        }

        /* 🔥 IMPROVED GLASS */
        .vurlo-glass {
          background: rgba(10, 10, 20, 0.55);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow:
            0 0 0 1px rgba(139,92,246,0.08),
            0 10px 40px rgba(109,40,217,0.25),
            0 1px 0 rgba(255,255,255,0.04) inset;
        }

        .vurlo-nav-link {
          position: relative;
          color: rgba(255, 255, 255, 0.44);
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.25s ease;
        }

        .vurlo-nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0%;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.2));
          transition: width 0.3s ease;
        }

        .vurlo-nav-link:hover {
          color: rgba(255, 255, 255, 0.92);
        }

        .vurlo-nav-link:hover::after {
          width: 100%;
        }

        .vurlo-icon-btn {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.2s ease;
        }

        .vurlo-icon-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.10);
          color: rgba(255, 255, 255, 0.92);
        }

        .vurlo-cart-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e8e8e8, #a0a0a0);
          color: #080808;
          font-size: 9px;
          font-weight: 700;
          display: grid;
          place-items: center;
          font-family: 'Syne', sans-serif;
        }

        .vurlo-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 20px;
          color: rgba(255,255,255,0.92);
        }

        .vurlo-logo-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: white;
          display: inline-block;
          margin-left: 3px;
        }

        .vurlo-wrapper {
          position: relative;
          z-index: 50;
          padding: 10px 20px 0;
        }

        .vurlo-inner {
          width: min(1200px, calc(100vw - 40px));
          margin: 0 auto;
          border-radius: 16px;
          overflow: hidden;
        }

        .mobile-menu {
          background: rgba(10,10,20,0.9);
          backdrop-filter: blur(20px);
        }

        @media (min-width: 768px) {
          .desktop { display: flex; }
          .mobile { display: none; }
        }

        @media (max-width: 767px) {
          .desktop { display: none; }
          .mobile { display: flex; }
        }
      `}</style>

      <div className="vurlo-wrapper vurlo-navbar" role="banner">
        <div className="vurlo-inner">
          <header className="vurlo-glass">
            <nav className="flex items-center justify-between px-6 h-[60px]">

              {/* Logo */}
              <a href="#" className="vurlo-logo-text">
                VURLO<span className="vurlo-logo-dot" />
              </a>

              {/* Links */}
              <ul className="desktop items-center gap-10">
                {links.map((l) => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase()}`} className="vurlo-nav-link">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Right */}
              <div className="flex items-center gap-2">
                <button className="vurlo-icon-btn">
                  <Search size={16} />
                </button>

                <button className="vurlo-icon-btn relative">
                  <ShoppingCart size={16} />
                  <span className="vurlo-cart-badge">2</span>
                </button>

                <button
                  className="vurlo-icon-btn mobile"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <X size={16} /> : <Menu size={16} />}
                </button>
              </div>
            </nav>
          </header>

          {/* Mobile menu */}
          {open && (
            <div className="mobile-menu px-6 py-4 mobile">
              {links.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase()}`}
                  className="block py-3 text-white/60"
                  onClick={() => setOpen(false)}
                >
                  {l}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
