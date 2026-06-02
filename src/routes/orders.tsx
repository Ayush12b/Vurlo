import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Clock,
  ShieldAlert,
  Check,
  Truck,
  Package,
} from "lucide-react";
import { resolveProductImage, formatPrice } from "@/components/FeaturedProducts";
import { toast } from "sonner";
import { getProductImage } from "@/utils/product";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  shippingDetails?: {
    name: string;
    address: string;
    city: string;
    pinCode: string;
    phone: string;
  };
}

function OrdersPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden page-transition">
      <div>
        <Navbar />
        <OrdersContent />
      </div>
      <Footer />
    </main>
  );
}

const stepsConfig = [
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    colorClass: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/10",
    completedColorClass: "bg-yellow-500 border-yellow-500 text-black shadow-yellow-500/20",
    message: "Awaiting payment verification.",
    estDays: "3-5 business days",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: Check,
    colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
    completedColorClass: "bg-blue-500 border-blue-500 text-white shadow-blue-500/20",
    message: "Order confirmed. Preparing your aesthetic lighting setup for dispatch.",
    estDays: "2-4 business days",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
    colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
    completedColorClass: "bg-purple-500 border-purple-500 text-white shadow-purple-500/20",
    message: "Dispatched. Shipped via Vurlo Express Cargo.",
    estDays: "1-2 business days",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: Package,
    colorClass: "text-green-400 bg-green-500/10 border-green-500/20 shadow-green-500/10",
    completedColorClass: "bg-green-500 border-green-500 text-white shadow-green-500/20",
    message: "Delivered to your address.",
    estDays: "",
  },
];

function OrderStatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 max-w-xs mx-auto">
        <ShieldAlert className="h-4 w-4" />
        Order Cancelled
      </div>
    );
  }

  const steps = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === status);
  const currentStep = stepsConfig[currentIdx] || stepsConfig[0];
  const mockCarrier = "VURLO Express Cargo";
  const mockTrackingId = `VRL-${status.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="w-full space-y-6">
      {/* Desktop Stepper */}
      <div className="hidden md:block relative w-full py-6">
        <div className="absolute left-[12.5%] right-[12.5%] top-[20px] h-[2px] -translate-y-1/2 bg-white/[0.06]" />

        <div
          className="absolute left-[12.5%] top-[20px] h-[2px] -translate-y-1/2 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{
            width: `${(currentIdx / (steps.length - 1)) * 75}%`,
            transformOrigin: "left",
          }}
        />

        <div className="flex justify-between items-start">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isUpcoming = idx > currentIdx;
            const config = stepsConfig[idx];
            const StepIcon = config.icon;

            let dotClass = "";
            let textClass = "";

            if (isCompleted) {
              dotClass = `${config.completedColorClass} scale-100`;
              textClass = "text-white/80 font-semibold";
            } else if (isCurrent) {
              dotClass = `${config.colorClass} scale-125 border border-current`;
              textClass = "text-white font-extrabold";
            } else {
              dotClass = "bg-[#090910] border-white/[0.12] text-white/30 border";
              textClass = "text-white/30";
            }

            return (
              <div key={step.key} className="flex flex-col items-center gap-3 w-1/4 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${dotClass}`}
                >
                  {isCompleted ? (
                    <Check className="h-4.5 w-4.5" />
                  ) : (
                    <StepIcon className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <span className={`text-[10px] uppercase tracking-widest block ${textClass}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden relative flex flex-col gap-6 pl-4 py-2">
        <div className="absolute left-[31px] top-6 bottom-6 w-[2px] bg-white/[0.06]" />

        <div
          className="absolute left-[31px] top-6 w-[2px] bg-gradient-to-b from-violet-500 to-cyan-400 transition-all duration-500"
          style={{
            height: `${(currentIdx / (steps.length - 1)) * 82}%`,
            transformOrigin: "top",
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isUpcoming = idx > currentIdx;
          const config = stepsConfig[idx];
          const StepIcon = config.icon;

          let dotClass = "";
          let textClass = "";

          if (isCompleted) {
            dotClass = `${config.completedColorClass} scale-100`;
            textClass = "text-white/80 font-semibold";
          } else if (isCurrent) {
            dotClass = `${config.colorClass} scale-110 border border-current`;
            textClass = "text-white font-bold";
          } else {
            dotClass = "bg-[#090910] border-white/[0.12] text-white/30 border";
            textClass = "text-white/30";
          }

          return (
            <div key={step.key} className="flex items-center gap-4 relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${dotClass} shrink-0`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <div className="space-y-0.5">
                <span className={`text-[11px] uppercase tracking-wider block ${textClass}`}>
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] text-gray-400 block leading-tight">
                    {config.message}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Box */}
      <div className="mt-4 p-4 rounded-xl border border-white/[0.05] bg-white/[0.01] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-wider shrink-0 ${currentStep.colorClass}`}
            >
              {status}
            </span>
            <p className="text-xs text-white/80 font-medium leading-tight">{currentStep.message}</p>
          </div>
          <p className="text-[10px] text-gray-400">
            Courier: <span className="text-white/60 font-semibold">{mockCarrier}</span> &middot;
            Tracking: <span className="font-mono text-white/60">{mockTrackingId}</span>
          </p>
        </div>

        {currentStep.estDays && (
          <div className="text-left sm:text-right shrink-0">
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              Estimated Delivery
            </p>
            <p className="text-xs font-bold text-violet-400 mt-0.5">{currentStep.estDays}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersContent() {
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const unsubRef = useRef<(() => void) | null>(null);
  const queryKey = ["orders", user?.uid] as const;
  // Real-time listener: pushes every Firestore update into React Query cache.
  // Runs once when user is available, cleans up on unmount.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        queryClient.setQueryData(queryKey, items);
      },
      (err) => {
        console.error("Orders listener error:", err);
        // Do NOT clear cache on error — keep showing last known orders
      },
    );
    unsubRef.current = unsub;
    return () => unsub();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey,
    enabled: !!user,
    // queryFn only runs on first mount before onSnapshot fires (provides initial data)
    queryFn: () =>
      new Promise<Order[]>((resolve) => {
        const q = query(collection(db, "orders"), where("userId", "==", user!.uid));
        const unsub = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          unsub(); // one-shot — the useEffect listener takes over after this
          resolve(items);
        });
      }),
    staleTime: Infinity, // onSnapshot keeps data fresh — never re-fetch on focus
    refetchOnWindowFocus: false, // prevents the wipe-on-focus bug
    refetchOnReconnect: false,
    retry: false, // don't retry on error — onSnapshot will recover
    placeholderData: (prev) => prev, // preserve previous orders if query re-runs
  });



  return (
    <div className="relative mx-auto max-w-4xl px-6 py-16 sm:py-24">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center items-center">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
      </div>

      <div className="mb-10 flex items-center justify-between">
        <div className="space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors duration-200 group mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to Collection
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white/90 sm:text-4xl">
            My Orders
          </h1>
          <p className="text-sm text-white/45">Track and view details of your premium purchases</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          <p className="text-xs text-white/40">Fetching your orders...</p>
        </div>
      ) : error ? (
        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 text-center text-sm text-red-400">
          An error occurred while loading your orders. Please refresh.
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="border border-white/[0.06] bg-white/[0.01] rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/70">No order history found</h3>
            <p className="text-xs text-white/40 mt-1">
              Explore our premium lighting setup products to place your first order.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2 text-xs font-semibold hover:bg-white/90 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const date = order.createdAt
              ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Pending processing";

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18] to-[#090910] shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Date Placed
                      </p>
                      <p className="text-xs font-medium text-white/80 mt-0.5">{date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                        Order Ref
                      </p>
                      <p className="text-xs font-medium text-white/80 mt-0.5 font-mono">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="border-b border-white/[0.04] bg-white/[0.01] px-6 py-5">
                  <OrderStatusTimeline status={order.status} />
                </div>

                {/* Order Items */}
                <div className="divide-y divide-white/[0.04] px-6 py-2">
                  {order.items?.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 py-4">
                      <img
                        src={resolveProductImage(getProductImage(item), item.name)}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-white/[0.03] border border-white/[0.06] flex-shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                            "",
                            item.name,
                          );
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white/90 truncate leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-white/40 mt-1">
                          Qty: {item.quantity} &middot; ₹{formatPrice(item.price)} each
                        </p>
                      </div>
                      <p className="text-xs font-bold text-white/80 shrink-0">
                        ₹{formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping Details */}
                {order.shippingDetails && (
                  <div className="border-t border-white/[0.04] bg-white/[0.01] px-6 py-4">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Shipping Details
                    </p>
                    <div className="text-xs text-white/70">
                      <p className="font-semibold text-white/95">{order.shippingDetails.name}</p>
                      <p className="text-white/60 mt-0.5">
                        {order.shippingDetails.address}, {order.shippingDetails.city} -{" "}
                        {order.shippingDetails.pinCode}
                      </p>
                      <p className="text-white/40 text-[10px] mt-1">
                        Phone: {order.shippingDetails.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Footer */}
                <div className="flex items-center justify-between bg-white/[0.01] px-6 py-4 border-t border-white/[0.04]">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Total Amount
                  </span>
                  <span className="text-sm font-extrabold text-white/90">
                    ₹{formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
