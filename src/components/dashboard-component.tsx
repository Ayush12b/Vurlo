import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  average,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Loader2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Receipt,
  User,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  total?: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Product {
  id: string;
  name: string;
  price: number;
  active?: boolean;
  stock?: number;
}

interface UserProfile {
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    avgPrice: 0,
  });

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);

        const ordersCol = collection(db, "orders");
        const productsCol = collection(db, "products");
        const usersCol = collection(db, "users");

        // 1. Load server-side aggregates and counts
        const [
          ordersCountSnap,
          usersCountSnap,
          productsCountSnap,
          activeProductsCountSnap,
          lowStockCountSnap,
          revenueSnap,
          priceStatsSnap,
        ] = await Promise.all([
          getCountFromServer(ordersCol),
          getCountFromServer(usersCol),
          getCountFromServer(productsCol),
          getCountFromServer(query(productsCol, where("active", "==", true))),
          getCountFromServer(query(productsCol, where("stock", "<=", 5))),
          getAggregateFromServer(ordersCol, {
            totalRevenue: sum("totalAmount"),
          }),
          getAggregateFromServer(productsCol, {
            avgPrice: average("price"),
          }),
        ]);

        // 2. Load only the last 10 orders for the recent list and the chart data
        const recentOrdersQuery = query(ordersCol, orderBy("createdAt", "desc"), limit(10));
        const recentOrdersSnap = await getDocs(recentOrdersQuery);

        // 3. Load only top 5 low stock products
        const lowStockQuery = query(productsCol, where("stock", "<=", 5), limit(5));
        const lowStockSnap = await getDocs(lowStockQuery);

        if (!active) return;

        const fetchedOrders = recentOrdersSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Order[];

        const fetchedLowStock = lowStockSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          name: docSnap.data().name || "",
          price: docSnap.data().price ?? 0,
          stock: docSnap.data().stock !== undefined ? Number(docSnap.data().stock) : 0,
          active: docSnap.data().active !== false,
        })) as Product[];

        // 4. Load user profiles ONLY for the customers in the recent orders list
        const uniqueUserIds = Array.from(
          new Set(fetchedOrders.map((o) => o.userId).filter(Boolean)),
        );
        const map: Record<string, UserProfile> = {};
        await Promise.all(
          uniqueUserIds.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              map[uid] = {
                name: data.name || "Customer",
                email: data.email || "No email",
              };
            }
          }),
        );

        setOrders(fetchedOrders);
        setLowStockProducts(fetchedLowStock);
        setUsersMap(map);
        setStats({
          totalOrders: ordersCountSnap.data().count,
          totalRevenue: revenueSnap.data().totalRevenue ?? 0,
          totalProducts: productsCountSnap.data().count,
          activeProducts: activeProductsCountSnap.data().count,
          totalCustomers: usersCountSnap.data().count,
          lowStockCount: lowStockCountSnap.data().count,
          avgPrice: priceStatsSnap.data().avgPrice ?? 0,
        });
      } catch (error) {
        console.error("Error fetching admin dashboard metrics:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-white/40">Gathering statistics and loading metrics...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalOrders = stats.totalOrders;
  const totalRevenue = stats.totalRevenue;
  const totalProducts = stats.totalProducts;
  const activeProducts = stats.activeProducts;

  // Group sales by day for the chart
  const salesChartData = (() => {
    if (!orders) return [];

    const groups: Record<
      string,
      { dateStr: string; dateMs: number; revenue: number; count: number }
    > = {};

    orders.forEach((order) => {
      if (!order.createdAt || order.status === "cancelled") return;
      const date = new Date((order.createdAt.seconds || 0) * 1000);
      const key = date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const dayStartMs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

      if (!groups[key]) {
        groups[key] = {
          dateStr: key,
          dateMs: dayStartMs,
          revenue: 0,
          count: 0,
        };
      }
      groups[key].revenue += order.totalAmount || 0;
      groups[key].count += 1;
    });

    // Sort chronologically and take up to the last 10 days for clarity
    return Object.values(groups)
      .sort((a, b) => a.dateMs - b.dateMs)
      .slice(-10);
  })();

  // Sort orders by date desc for recent list
  const recentOrders = orders
    ? [...orders]
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        })
        .slice(0, 5)
    : [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.05)]">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-450 text-blue-400">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.05)]">
            <Truck className="h-3 w-3" />
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.05)]">
            <CheckCircle2 className="h-3 w-3" />
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-white/90">
          Executive Dashboard
        </h1>
        <p className="text-xs text-white/45">
          Real-time sales tracking, order analysis, and catalog metrics.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <DollarSign className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {formatPrice(totalRevenue)}
            </h3>
            <p className="text-[10px] text-white/35 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              Exclude cancelled orders
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <Receipt className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Total Orders
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">{totalOrders}</h3>
            <p className="text-[10px] text-white/35">Total transactions in checkout</p>
          </div>
        </div>

        {/* Catalog Products */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <ShoppingBag className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Active Catalog
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {activeProducts}{" "}
              <span className="text-xs text-white/30 font-medium">/ {totalProducts}</span>
            </h3>
            <p className="text-[10px] text-white/35">Products active in storefront</p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition duration-300">
            <AlertCircle className="h-24 w-24 text-white" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Low Stock Items
            </span>
            <div
              className={`p-2 rounded-xl border text-xs font-semibold ${
                stats.lowStockCount > 0
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3
              className={`text-2xl font-black tracking-tight ${
                stats.lowStockCount > 0 ? "text-red-400" : "text-white"
              }`}
            >
              {stats.lowStockCount}
            </h3>
            <p className="text-[10px] text-white/35">Items with 5 or less in stock</p>
          </div>
        </div>
      </div>

      {/* Charts & Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white/90">Revenue Overview</h3>
              <p className="text-[10px] text-white/35">Daily sales distribution trend</p>
            </div>
          </div>

          <div className="h-72 w-full text-xs">
            {salesChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/35">
                No orders recorded yet to chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255, 255, 255, 0.03)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dateStr"
                    stroke="rgba(255, 255, 255, 0.25)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255, 255, 255, 0.25)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 10, 18, 0.95)",
                      borderColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "white",
                      fontSize: "11px",
                    }}
                    formatter={(value: number | string) => [
                      `₹${Number(value).toLocaleString("en-IN")}`,
                      "Revenue",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="url(#revenueGlow)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Breakdowns or side info card */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white/90">Inventory Alerts</h3>
              <p className="text-[10px] text-white/35">Products running low on stock</p>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-xs text-white/35 py-6 text-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                  All catalog items are well stocked.
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-red-500/10 bg-red-500/[0.01]"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white/80 truncate pr-2">{p.name}</p>
                      <p className="text-[9px] text-white/30 pr-2">Price: {formatPrice(p.price)}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md shrink-0">
                      {p.stock ?? 0} left
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white/80">Average Price</p>
                  <p className="text-[9px] text-white/30">Avg price in catalog</p>
                </div>
                <span className="text-sm font-bold text-cyan-400">
                  {formatPrice(stats.avgPrice)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/[0.04]">
            <Link
              to="/admin/products"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-xs font-bold text-violet-400 uppercase tracking-wider transition-colors duration-200"
            >
              Manage Catalog
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white/90">Recent Operations</h3>
            <p className="text-[10px] text-white/35">Showing latest 5 orders in checkout</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white/80 transition-colors duration-255 flex items-center gap-1 group"
          >
            All Orders
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/35">
              No orders recorded in database.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentOrders.map((order) => {
                  const customer = usersMap?.[order.userId] || {
                    name: "Guest User",
                    email: "No account",
                  };
                  const itemsCount =
                    order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) ?? 0;

                  return (
                    <tr key={order.id} className="text-xs text-white/70 hover:bg-white/[0.01]">
                      <td className="py-4 font-mono font-semibold text-white/50">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-white/90 leading-normal">
                            {customer.name}
                          </p>
                          <p className="text-[10px] text-white/35 mt-0.5">{customer.email}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-medium text-white/80">
                          {itemsCount} {itemsCount === 1 ? "item" : "items"}
                        </span>
                      </td>
                      <td className="py-4 font-extrabold text-white/90">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="py-4">{getStatusBadge(order.status)}</td>
                      <td className="py-4 text-right">
                        <Link
                          to="/admin/orders"
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 text-white/40 hover:text-violet-400 transition"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
