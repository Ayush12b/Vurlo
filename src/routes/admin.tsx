import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { checkIsAdmin } from "@/lib/admin-auth";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  LogOut,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  Loader2,
  ShieldCheck,
  Heart,
  MessageSquare,
  Bell,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading: authLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = location.pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAdmin(false);
      return;
    }

    if (authLoading) {
      return;
    }

    if (!user) {
      navigate({ to: "/admin/login" });
      setCheckingAdmin(false);
      return;
    }

    const verifyAdmin = async () => {
      setCheckingAdmin(true);
      const authorized = await checkIsAdmin(user.uid, user.email);
      setIsAdmin(authorized);
      setCheckingAdmin(false);

      if (!authorized) {
        toast.error("Access Denied", {
          description: "You do not have permission to access the admin panel.",
        });
        // Redirect to homepage instead of logging out
        navigate({ to: "/" });
      }
    };

    verifyAdmin();
  }, [user, authLoading, isLoginPage, navigate]);

  if (isLoginPage) {
    return <Outlet />;
  }

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.03] blur-[100px]" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
          <p className="text-sm font-medium tracking-wide text-white/50 animate-pulse">
            Authenticating Admin...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const navLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: ShoppingBag },
    { to: "/admin/orders", label: "Orders", icon: Receipt },
    { to: "/admin/wishlists", label: "Wishlists", icon: Heart },
    { to: "/admin/contacts", label: "Contacts", icon: MessageSquare },
    { to: "/admin/stock-requests", label: "Stock Requests", icon: Bell },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate({ to: "/admin/login" });
    } catch (e) {
      console.error(e);
      toast.error("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#030307] text-white flex flex-col md:flex-row relative">
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/[0.03] blur-[140px]" />
        <div className="absolute bottom-10 right-1/3 w-[450px] h-[450px] rounded-full bg-cyan-500/[0.02] blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-black/40 border-r border-white/[0.06] backdrop-blur-xl h-screen sticky top-0 p-6 justify-between z-45">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <span className="font-display font-black text-xl tracking-wider bg-gradient-to-r from-white via-white/80 to-white/60 bg-clip-text text-transparent">
              VURLO
            </span>
            <span className="px-2 py-0.5 rounded-md border border-violet-500/20 bg-violet-500/10 text-[9px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </span>
          </div>

          {/* Nav list */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    className:
                      "bg-white/[0.04] text-white border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.05)]",
                  }}
                  inactiveProps={{
                    className:
                      "text-white/45 hover:text-white/80 hover:bg-white/[0.02] border-transparent",
                  }}
                  className="flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-semibold tracking-wide transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-105" />
                    {link.label}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="space-y-4 pt-6 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-2">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
              alt="Admin"
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-white/90">
                {user.displayName || "Admin User"}
              </p>
              <p className="text-[10px] text-white/35 truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-white/40 hover:text-white/80 hover:bg-white/[0.02] transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer text-left"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-lg tracking-wider">VURLO</span>
          <span className="px-1.5 py-0.5 rounded border border-violet-500/20 bg-violet-500/10 text-[8px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-0.5">
            <ShieldCheck className="h-2.5 w-2.5" />
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg border border-white/10 bg-white/[0.02] text-white/70"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#030307]/95 z-30 pt-16 flex flex-col justify-between p-6 animate-in fade-in duration-200">
          <nav className="space-y-2 mt-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  activeProps={{
                    className: "bg-white/[0.05] text-white border-violet-500/50",
                  }}
                  inactiveProps={{
                    className: "text-white/50 border-transparent",
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold tracking-wide"
                >
                  <Icon className="h-4.5 w-4.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4 pt-6 border-t border-white/[0.06] mb-8">
            <div className="flex items-center gap-3">
              <img
                src={
                  user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
                }
                alt="Admin"
                className="w-9 h-9 rounded-full object-cover border border-white/10"
              />
              <div>
                <p className="text-xs font-semibold text-white/90">
                  {user.displayName || "Admin User"}
                </p>
                <p className="text-[10px] text-white/35">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs font-semibold text-white/60 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Storefront
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
