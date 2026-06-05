import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Loader2,
  Sparkles,
  Heart,
  Bell,
  BellOff,
  Package,
  AlertCircle,
  Info,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth, DEFAULT_AVATAR } from "@/hooks/use-auth";
import { AuthModal } from "@/components/AuthModal";
import { SearchModal } from "@/components/SearchModal";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { resolveProductImage } from "@/components/FeaturedProducts";
import { Link, useNavigate } from "@tanstack/react-router";
import { checkIsAdmin } from "@/lib/admin-auth";
import { getProductImage } from "@/utils/product";
import { useProducts } from "@/hooks/use-products";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const links = ["Home", "Shop", "Categories", "Contact"];

const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return "Just now";
  let date: Date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getNotificationIcon = (type: "order" | "system" | "alert") => {
  switch (type) {
    case "order":
      return Package;
    case "alert":
      return AlertCircle;
    case "system":
    default:
      return Info;
  }
};

const getNotificationIconStyles = (type: "order" | "system" | "alert") => {
  switch (type) {
    case "order":
      return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case "alert":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "system":
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }
};

export function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, profileName, profilePhoto, authModalOpen, setAuthModalOpen, logout, loading } =
    useAuth();
  const { cartItems, cartCount, updateQuantity, removeFromCart, addToCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await markAsRead(n.id);
    }
    if (n.link) {
      navigate({ to: n.link });
    }
  };
  const [animateCart, setAnimateCart] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: allProducts } = useProducts();
  const recommendedProducts = useMemo(
    () => (allProducts ? allProducts.slice(0, 3) : undefined),
    [allProducts],
  );

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    checkIsAdmin(user.uid, user.email).then(setIsAdmin);
  }, [user]);

  const handleCheckout = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setCartOpen(false);
    navigate({ to: "/checkout" });
  };

  useEffect(() => {
    if (cartCount > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <>
      <style>{`
        /* Syne font loaded globally via styles.css */

        .vurlo-navbar {
          font-family: 'Inter', sans-serif;
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

        @keyframes badge-pop {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.35);
            box-shadow: 0 0 12px rgba(138, 46, 255, 0.6);
            background: linear-gradient(135deg, #a78bfa, #8a2eff);
            color: #ffffff;
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-badge-pop {
          animation: badge-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes cart-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.12) translateY(-2px);
          }
        }

        .animate-cart-bounce {
          animation: cart-bounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
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
              <Link to="/" className="vurlo-logo-text">
                VURLO
                <span className="vurlo-logo-dot" />
              </Link>

              {/* Links */}
              <ul className="desktop items-center gap-10">
                {links.map((l) => (
                  <li key={l}>
                    {l === "Contact" ? (
                      <Link to="/contact" className="vurlo-nav-link">
                        {l}
                      </Link>
                    ) : (
                      <Link
                        to="/"
                        hash={l === "Home" ? undefined : l.toLowerCase()}
                        className="vurlo-nav-link"
                      >
                        {l}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {/* Right */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="vurlo-icon-btn cursor-pointer focus:outline-none"
                  aria-label="Search essentials"
                >
                  <Search size={16} />
                </button>

                <Link
                  to="/wishlist"
                  className="vurlo-icon-btn relative cursor-pointer focus:outline-none flex items-center justify-center text-white/70 hover:text-white"
                  aria-label="Wishlist"
                >
                  <Heart size={16} />
                  {wishlistCount > 0 && (
                    <span className="vurlo-cart-badge bg-rose-500 text-white">{wishlistCount}</span>
                  )}
                </Link>

                {/* Notifications Bell Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="vurlo-icon-btn relative cursor-pointer focus:outline-none flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
                      aria-label="Notifications"
                    >
                      <Bell
                        size={16}
                        className="transition-transform duration-300 hover:rotate-12"
                      />
                      {unreadCount > 0 && (
                        <span className="absolute top-[3px] right-[3px] min-w-[8px] h-2 bg-rose-500 rounded-full border border-[#0f0f18] shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 sm:w-[400px] bg-[#0c0c14]/95 border border-white/[0.08] text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(138,46,255,0.05)] p-4.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300 max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-[100dvh] max-sm:rounded-none max-sm:max-h-none max-sm:z-50 max-sm:flex max-sm:flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] max-sm:pt-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                        Notifications
                      </span>
                      <div className="flex items-center gap-3">
                        {user && unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllAsRead();
                            }}
                            className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-wider cursor-pointer"
                          >
                            Mark all
                          </button>
                        )}
                        {/* Mobile close button inside DropdownMenuItem so it closes the dropdown */}
                        <DropdownMenuItem asChild>
                          <button className="sm:hidden w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.06] hover:bg-white/[0.04] text-white/60 hover:text-white cursor-pointer focus:outline-none focus:bg-transparent">
                            <X size={14} />
                          </button>
                        </DropdownMenuItem>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[320px] sm:max-h-[360px] overflow-y-auto py-2.5 space-y-2 pr-1 mt-2 flex-1">
                      {!user ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                          <Bell className="h-8 w-8 text-white/20" />
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-white tracking-tight">
                              Login to view updates
                            </p>
                            <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed mx-auto">
                              Get instant updates on your orders and account alerts.
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAuthModalOpen(true);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider h-8 px-4 rounded-lg text-white transition-all duration-300 cursor-pointer"
                            style={{
                              background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
                            }}
                          >
                            Login Now
                          </button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                          <BellOff className="h-8 w-8 text-white/20" />
                          <div>
                            <p className="text-xs font-bold text-white/80">No notifications yet</p>
                            <p className="text-[10px] text-gray-400 max-w-[200px] leading-relaxed mx-auto mt-0.5">
                              We'll alert you about order updates, tracking, and promotions.
                            </p>
                          </div>
                        </div>
                      ) : (
                        notifications.slice(0, 7).map((n) => {
                          const IconComponent = getNotificationIcon(n.type);
                          return (
                            <DropdownMenuItem
                              key={n.id}
                              asChild
                              className="focus:bg-transparent focus:text-white p-0"
                            >
                              <div
                                onClick={() => handleNotificationClick(n)}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ease-out cursor-pointer hover:scale-[1.01] ${
                                  n.read
                                    ? "bg-transparent border-transparent border-l-2 border-l-transparent hover:bg-white/[0.03] hover:border-white/[0.04] hover:shadow-[0_4px_12px_rgba(255,255,255,0.01)]"
                                    : "bg-violet-500/[0.03] border-white/[0.04] border-l-2 border-l-violet-500 hover:bg-violet-500/[0.05] hover:border-white/[0.06] hover:shadow-[0_4px_15px_rgba(139,92,246,0.04)]"
                                }`}
                              >
                                {/* Icon container */}
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getNotificationIconStyles(
                                    n.type,
                                  )}`}
                                >
                                  <IconComponent size={14} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-[11px] leading-normal ${
                                      n.read ? "text-white/60" : "text-white/90 font-medium"
                                    }`}
                                  >
                                    {n.message}
                                  </p>
                                  <span className="text-[9px] text-white/30 block mt-1">
                                    {formatTimeAgo(n.timestamp)}
                                  </span>
                                </div>

                                {/* Unread indicator */}
                                {!n.read && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 self-center shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse" />
                                )}
                              </div>
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </div>

                    {/* View All Footer Link */}
                    {user && notifications.length > 0 && (
                      <div className="pt-3 border-t border-white/[0.08] mt-2 flex justify-center">
                        <DropdownMenuItem asChild>
                          <Link
                            to="/notifications"
                            className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer focus:outline-none focus:bg-transparent"
                          >
                            View All Notifications
                          </Link>
                        </DropdownMenuItem>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                  <SheetTrigger asChild>
                    <button
                      className={`vurlo-icon-btn relative cursor-pointer focus:outline-none ${animateCart ? "animate-cart-bounce" : ""}`}
                    >
                      <ShoppingCart size={16} />
                      {cartCount > 0 && (
                        <span
                          className={`vurlo-cart-badge ${animateCart ? "animate-badge-pop" : ""}`}
                        >
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md bg-black/95 border-l border-white/[0.08] text-white p-6 shadow-[-10px_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(138,46,255,0.08)] backdrop-blur-xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <SheetHeader className="pb-4 border-b border-white/[0.08]">
                      <SheetTitle className="text-xl font-bold tracking-tight text-white/90">
                        Your Cart
                      </SheetTitle>
                      <SheetDescription className="text-white/50 text-xs">
                        Review the items in your cart.
                      </SheetDescription>
                    </SheetHeader>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                      {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-between min-h-[200px] h-full text-center py-6 animate-in fade-in duration-300">
                          {/* Top: Custom glowing cart illustration and engaging text */}
                          <div className="flex flex-col items-center justify-center space-y-4 my-auto">
                            <div className="relative w-16 h-16 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-white/40 shadow-[0_0_30px_rgba(138,46,255,0.08)]">
                              <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-cyan-500/10 rounded-full blur-md" />
                              <ShoppingCart className="h-6 w-6 text-violet-400 relative z-10" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-white tracking-tight">
                                Your cart is empty
                              </p>
                              <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed mx-auto">
                                Explore our curated premium lighting, ambient lamps, and room decor
                                to elevate your space.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setCartOpen(false);
                                navigate({ to: "/search" });
                              }}
                              className="w-full max-w-[180px] text-xs font-bold uppercase tracking-wider h-10 rounded-xl text-white transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2 mt-2"
                              style={{
                                background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
                              }}
                            >
                              Shop the Collection
                            </button>
                          </div>

                          {/* Bottom: Recommended Products Section */}
                          {recommendedProducts && recommendedProducts.length > 0 && (
                            <div className="w-full border-t border-white/[0.06] pt-6 mt-6 space-y-3.5 text-left">
                              <div className="flex items-center gap-1.5 px-1">
                                <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                  Setup Upgrades
                                </span>
                              </div>
                              <div className="space-y-2.5">
                                {recommendedProducts.map((p) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition duration-200"
                                  >
                                    <img
                                      src={resolveProductImage(getProductImage(p), p.name)}
                                      alt={p.name}
                                      loading="lazy"
                                      className="w-10 h-10 rounded-lg object-cover bg-white/[0.03] border border-white/[0.06] shrink-0"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                          resolveProductImage("", p.name);
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-white/95 truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-[11px] font-bold text-violet-400 mt-0.5">
                                        ₹{p.price.toLocaleString("en-IN")}
                                      </p>
                                    </div>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await addToCart({
                                            productId: p.id,
                                            name: p.name,
                                            price: p.price,
                                            image: getProductImage(p),
                                          });
                                          toast.success("Added to cart", {
                                            description: `${p.name} added to your bag.`,
                                            duration: 2000,
                                          });
                                        } catch (err) {
                                          toast.error("Failed to add to cart");
                                        }
                                      }}
                                      className="text-[10px] font-bold text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                                    >
                                      Quick Add
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        cartItems.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition duration-200"
                          >
                            <img
                              src={resolveProductImage(getProductImage(item), item.name)}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-white/[0.03] border border-white/[0.06]"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                                  "",
                                  item.name,
                                );
                              }}
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white/90 truncate leading-snug">
                                {item.name}
                              </p>
                              <p className="text-xs font-bold text-violet-400 mt-1">
                                ₹{item.price.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-white/[0.08] bg-white/[0.02] rounded-lg overflow-hidden h-7">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-6 h-full flex items-center justify-center hover:bg-white/[0.06] transition text-white/60 hover:text-white text-xs cursor-pointer focus:outline-none"
                                >
                                  -
                                </button>
                                <span className="w-5 text-center text-[10px] font-bold text-white/80 select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="w-6 h-full flex items-center justify-center hover:bg-white/[0.06] transition text-white/60 hover:text-white text-xs cursor-pointer focus:outline-none"
                                >
                                  +
                                </button>
                              </div>
                              {/* Remove Button */}
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.06] hover:border-red-500/20 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition cursor-pointer focus:outline-none"
                                aria-label="Remove item"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Cart Footer */}
                    {cartItems.length > 0 && (
                      <div className="border-t border-white/[0.08] pt-4 mt-auto space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                            Subtotal
                          </span>
                          <span className="text-lg font-bold text-white/90">
                            ₹
                            {cartItems
                              .reduce((acc, item) => acc + item.price * item.quantity, 0)
                              .toLocaleString("en-IN")}
                          </span>
                        </div>
                        <button
                          onClick={handleCheckout}
                          className="w-full text-xs font-bold uppercase tracking-wider h-11 rounded-xl text-white transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2"
                          style={{
                            background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
                          }}
                        >
                          Secure Checkout
                        </button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>

                {/* Auth Button Desktop */}
                <div className="hidden md:flex items-center ml-2">
                  {loading ? (
                    <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                    </div>
                  ) : user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-center rounded-full p-0.5 border border-white/10 hover:border-violet-500/30 transition-all duration-300 shadow-[0_0_10px_rgba(138,46,255,0.08)] hover:shadow-[0_0_15px_rgba(138,46,255,0.25)] scale-100 hover:scale-[1.05] cursor-pointer focus:outline-none">
                          <img
                            src={profilePhoto || DEFAULT_AVATAR}
                            alt={profileName || "User"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-black/95 border border-white/[0.08] text-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(138,46,255,0.1)] p-1.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-2.5 py-2">
                          <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                            {profileName || "User"}
                          </p>
                        </div>
                        <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
                        <DropdownMenuItem
                          asChild
                          className="text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-white rounded-lg px-2.5 py-2 cursor-pointer transition-colors duration-150"
                        >
                          <Link to="/profile">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.04] focus:bg-white/[0.04] focus:text-white rounded-lg px-2.5 py-2 cursor-pointer transition-colors duration-150"
                        >
                          <Link to="/orders">My Orders</Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            asChild
                            className="text-xs font-semibold text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 focus:bg-violet-500/10 focus:text-violet-300 rounded-lg px-2.5 py-2 cursor-pointer transition-colors duration-150"
                          >
                            <Link to="/admin/dashboard">Admin Panel</Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-white/[0.06] my-1" />
                        <DropdownMenuItem
                          onClick={logout}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 rounded-lg px-2.5 py-2 cursor-pointer transition-colors duration-150"
                        >
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white/90 border border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition duration-300 cursor-pointer"
                    >
                      Login
                    </button>
                  )}
                </div>

                {/* Auth Button Mobile — visible only on mobile */}
                <div className="flex md:hidden items-center">
                  {!loading &&
                    (user ? (
                      <button
                        onClick={() => setOpen(!open)}
                        className="flex items-center justify-center rounded-full p-0.5 border border-white/10 hover:border-violet-500/30 transition-all duration-300 cursor-pointer focus:outline-none"
                      >
                        <img
                          src={profilePhoto || DEFAULT_AVATAR}
                          alt={profileName || "User"}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      </button>
                    ) : (
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white/90 border border-white/[0.08] bg-white/[0.03] hover:border-white/20 transition duration-300 cursor-pointer"
                      >
                        Login
                      </button>
                    ))}
                </div>

                <button
                  className="vurlo-icon-btn mobile active:scale-90 transition-transform"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </nav>
          </header>

          {/* Mobile menu */}
          {open && (
            <div className="mobile-menu px-6 py-4 mobile flex-col gap-1 border border-white/[0.06] border-t-0 rounded-b-2xl">
              {links.map((l) =>
                l === "Contact" ? (
                  <Link
                    key={l}
                    to="/contact"
                    className="block py-3 text-white/60 hover:text-white transition duration-200"
                    onClick={() => setOpen(false)}
                  >
                    {l}
                  </Link>
                ) : (
                  <Link
                    key={l}
                    to="/"
                    hash={l === "Home" ? undefined : l.toLowerCase()}
                    className="block py-3 text-white/60 hover:text-white transition duration-200"
                    onClick={() => setOpen(false)}
                  >
                    {l}
                  </Link>
                ),
              )}

              {/* Auth Mobile Action */}
              <div className="border-t border-white/[0.05] mt-2 pt-3">
                {loading ? (
                  <div className="flex items-center gap-2.5 px-1 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                    <span className="text-xs text-white/40">Resolving session...</span>
                  </div>
                ) : user ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 pb-1">
                      <img
                        src={profilePhoto || DEFAULT_AVATAR}
                        alt={profileName || "User"}
                        className="w-7 h-7 rounded-full border border-white/10 object-cover"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white/80 truncate">
                          {profileName || "User"}
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      className="block text-xs font-medium text-white/60 hover:text-white py-1.5 transition duration-200"
                      onClick={() => setOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block text-xs font-medium text-white/60 hover:text-white py-1.5 transition duration-200"
                      onClick={() => setOpen(false)}
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="block text-xs font-semibold text-violet-400 hover:text-violet-300 py-1.5 transition duration-200"
                        onClick={() => setOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="block w-full text-left py-2 text-red-400 font-semibold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                      setOpen(false);
                    }}
                    className="block w-full text-left py-2 text-white/90 font-semibold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
