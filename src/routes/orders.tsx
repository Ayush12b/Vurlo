import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { resolveProductImage } from "@/components/FeaturedProducts";
import { toast } from "sonner";

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

  return (
    <div className="w-full py-4 px-2">
      <div className="relative flex items-center justify-between">
        {/* Connecting Line Background */}
        <div className="absolute left-6 right-6 top-3 h-[2px] -translate-y-1/2 bg-white/[0.06]" />

        {/* Connecting Line Active */}
        <div
          className="absolute left-6 right-6 top-3 h-[2px] -translate-y-1/2 bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
          style={{
            width: `${(currentIdx / (steps.length - 1)) * 100}%`,
            transformOrigin: "left",
          }}
        />

        {/* Steps */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          let dotClass = "";
          let textClass = "";

          if (isCompleted) {
            dotClass = "bg-violet-500 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]";
            textClass = "text-white/80 font-semibold";
          } else if (isCurrent) {
            dotClass =
              "bg-black border-cyan-400 border-2 scale-125 shadow-[0_0_15px_rgba(34,211,238,0.6)]";
            textClass = "text-cyan-400 font-extrabold";
          } else {
            dotClass = "bg-[#090910] border-white/[0.12] border";
            textClass = "text-white/30";
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
              {/* Step Circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${dotClass}`}
              >
                {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>

              {/* Step Label */}
              <span className={`text-[10px] uppercase tracking-wider text-center ${textClass}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersContent() {
  const { user } = useAuth();

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["orders", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      const q = query(collection(db, "orders"), where("userId", "==", user!.uid));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      // Sort locally by createdAt desc to avoid index requirement
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      return items;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN").format(price);
  };

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
            <h3 className="text-sm font-semibold text-white/70">
              You haven't placed any orders yet
            </h3>
            <p className="text-xs text-white/40 mt-1">
              Browse our collection to order future-ready essential tech.
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
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 py-4">
                      <img
                        src={resolveProductImage(item.image, item.name)}
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
