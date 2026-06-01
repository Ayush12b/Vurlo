import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, CheckCircle2, ArrowRight, ShoppingBag } from "lucide-react";
import { resolveProductImage } from "@/components/FeaturedProducts";
import { getProductImage } from "@/utils/product";

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orderId: (search.orderId as string) || undefined,
    };
  },
  component: OrderSuccessPage,
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

function OrderSuccessPage() {
  const { user, loading } = useAuth();
  const { orderId } = Route.useSearch();

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
        <OrderSuccessContent orderId={orderId} />
      </div>
      <Footer />
    </main>
  );
}

function OrderSuccessContent({ orderId }: { orderId?: string }) {
  const { user } = useAuth();

  const { data: latestOrder, isLoading } = useQuery<Order | null>({
    queryKey: ["latest-order", orderId, user?.uid],
    enabled: !!user && !!orderId,
    queryFn: async () => {
      if (!orderId) return null;

      const docRef = doc(db, "orders", orderId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      // Ensure the order belongs to the logged-in user
      if (data.userId !== user?.uid) {
        return null;
      }

      return {
        id: docSnap.id,
        ...data,
      } as Order;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN").format(price);
  };

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        <p className="text-xs text-white/40">Loading order summary...</p>
      </div>
    );
  }

  if (!latestOrder) {
    return (
      <div className="relative mx-auto max-w-md px-6 py-24 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30">
          <ShoppingBag size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white/70">No orders found</h3>
          <p className="text-xs text-white/40 mt-1">
            If you recently completed a checkout, your order history will appear here shortly.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-2 text-xs font-semibold hover:bg-white/90 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const orderDate = latestOrder.createdAt
    ? new Date(latestOrder.createdAt.seconds * 1000)
    : new Date();

  const date = latestOrder.createdAt
    ? orderDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Just now";

  const deliveryDate = new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative mx-auto max-w-2xl px-6 py-16 sm:py-24 flex flex-col items-center">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center items-center">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-violet-600/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-cyan-500/[0.03] blur-[90px]" />
      </div>

      {/* Success Badge / Icon */}
      <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in zoom-in-50 duration-500">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <div className="text-center mb-10 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white/90 sm:text-4xl">
          Order Confirmed!
        </h1>
        <p className="text-sm text-white/45 max-w-md mx-auto">
          Thank you for your order. We've received your order, and your workspace upgrades are being
          prepared for shipment.
        </p>
      </div>

      {/* Order Summary Card */}
      <div className="w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18] to-[#090910] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              Date Placed
            </p>
            <p className="text-xs font-medium text-white/80 mt-0.5">{date}</p>
            <p className="text-[10px] text-white/45 mt-1">
              Estimated delivery: {formattedDeliveryDate}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              Order Reference
            </p>
            <p className="text-xs font-medium text-white/80 mt-0.5 font-mono">
              #{latestOrder.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="divide-y divide-white/[0.04] px-6 py-2">
          {latestOrder.items?.map((item) => (
            <div key={item.productId} className="flex items-center gap-4 py-4">
              <img
                src={resolveProductImage(getProductImage(item), item.name)}
                alt={item.name}
                className="w-12 h-12 rounded-xl object-cover bg-white/[0.03] border border-white/[0.06] flex-shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = resolveProductImage("", item.name);
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
        {latestOrder.shippingDetails && (
          <div className="border-t border-white/[0.06] bg-white/[0.01]/40 px-6 py-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
              Shipping Address
            </p>
            <div className="text-xs text-white/70 space-y-1">
              <p className="font-semibold text-white/95">{latestOrder.shippingDetails.name}</p>
              <p className="text-white/60">
                {latestOrder.shippingDetails.address}, {latestOrder.shippingDetails.city} -{" "}
                {latestOrder.shippingDetails.pinCode}
              </p>
              <p className="text-white/40 text-[10px] mt-1">
                Phone: {latestOrder.shippingDetails.phone}
              </p>
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between bg-white/[0.01] px-6 py-4 border-t border-white/[0.04]">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Total Paid
          </span>
          <span className="text-sm font-extrabold text-white/90">
            ₹{formatPrice(latestOrder.totalAmount)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white text-black px-8 py-3 text-xs font-semibold hover:bg-white/90 transition shadow-[0_4px_20px_rgba(255,255,255,0.1)] cursor-pointer"
        >
          Continue Shopping
        </Link>
        <Link
          to="/orders"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white px-8 py-3 text-xs font-semibold transition cursor-pointer"
        >
          View All Orders
          <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
