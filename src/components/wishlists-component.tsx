import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { resolveProductImage } from "@/components/FeaturedProducts";
import { getProductImage } from "@/utils/product";
import { Loader2, Heart, Search, User, Mail, Tag, ShoppingBag } from "lucide-react";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  originalPrice?: number;
  isOnSale?: boolean;
  discountPercentage?: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface UserWishlist {
  user: UserProfile;
  items: WishlistItem[];
}

export default function AdminWishlists() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users and their wishlists in parallel
  const { data: userWishlists, isLoading } = useQuery<UserWishlist[]>({
    queryKey: ["admin", "wishlists"],
    queryFn: async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Customer",
          email: data.email || "No email",
          photoURL: data.photoURL || "",
        };
      }) as UserProfile[];

      const wishlistPromises = usersList.map(async (user) => {
        const wishlistSnap = await getDocs(collection(db, "users", user.id, "wishlist"));
        const items = wishlistSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || "",
            price: data.price ?? 0,
            image: getProductImage(data),
            images: data.images || [],
            category: data.category || "Gadgets",
            originalPrice: data.originalPrice,
            isOnSale: data.isOnSale || false,
            discountPercentage: data.discountPercentage || 0,
          };
        });
        return { user, items };
      });

      const results = await Promise.all(wishlistPromises);
      // Filter out users who have nothing in their wishlists
      return results.filter((r) => r.items.length > 0);
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm text-white/45">Loading user profiles and wishlist items...</p>
      </div>
    );
  }

  // Filtered wishlists logic
  const filteredWishlists = userWishlists
    ? userWishlists.filter((uw) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const matchesName = uw.user.name.toLowerCase().includes(query);
        const matchesEmail = uw.user.email.toLowerCase().includes(query);
        const matchesProducts = uw.items.some(
          (item) =>
            item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query),
        );

        return matchesName || matchesEmail || matchesProducts;
      })
    : [];

  const totalWishlistedItems = userWishlists
    ? userWishlists.reduce((acc, curr) => acc + curr.items.length, 0)
    : 0;

  const totalUsersWithWishlist = userWishlists ? userWishlists.length : 0;

  const popularityLeaderboard = (() => {
    if (!userWishlists) return [];

    const countsMap: Record<string, { item: WishlistItem; count: number }> = {};
    userWishlists.forEach((uw) => {
      uw.items.forEach((item) => {
        if (!countsMap[item.id]) {
          countsMap[item.id] = { item, count: 0 };
        }
        countsMap[item.id].count += 1;
      });
    });

    return Object.values(countsMap).sort((a, b) => b.count - a.count);
  })();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN").format(price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 backdrop-blur-sm mb-2.5">
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
              Admin Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Customer Wishlists
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Analyze customer interest and monitor which workspace gear has been saved.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
          <input
            type="text"
            placeholder="Search by customer or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/40 text-white rounded-xl placeholder:text-white/20 h-10 pl-10 pr-3 text-xs tracking-wide focus:outline-none transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">
            Active Wishlists
          </p>
          <p className="text-2xl font-bold text-white tracking-tight">{totalUsersWithWishlist}</p>
          <p className="text-[10px] text-white/40 mt-1.5">Customers with saved products</p>
        </div>
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">
            Total Saved Items
          </p>
          <p className="text-2xl font-bold text-rose-400 tracking-tight">{totalWishlistedItems}</p>
          <p className="text-[10px] text-white/40 mt-1.5">Total across all collections</p>
        </div>
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">
            Avg. Saved Per User
          </p>
          <p className="text-2xl font-bold text-cyan-400 tracking-tight">
            {totalUsersWithWishlist > 0
              ? (totalWishlistedItems / totalUsersWithWishlist).toFixed(1)
              : 0}
          </p>
          <p className="text-[10px] text-white/40 mt-1.5">Items per active wishlist</p>
        </div>
      </div>

      {/* Product Popularity Leaderboard */}
      {popularityLeaderboard.length > 0 && (
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18]/60 to-[#07070c]/80 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Product Popularity Leaderboard
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <th className="pb-3 pl-2">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3 text-right pr-2">Saved Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {popularityLeaderboard.map(({ item, count }) => (
                  <tr key={item.id} className="text-xs text-white/70 hover:bg-white/[0.01]">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(getProductImage(item), item.name)}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-white/[0.03] border border-white/[0.06]"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                              "",
                              item.name,
                            );
                          }}
                        />
                        <div>
                          <p className="font-semibold text-white/95 leading-tight">{item.name}</p>
                          <p className="text-[9px] font-mono text-white/25 mt-0.5">
                            ID: {item.id.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 uppercase tracking-wider text-[10px] text-white/50">
                      {item.category}
                    </td>
                    <td className="py-3 font-bold text-violet-400">₹{formatPrice(item.price)}</td>
                    <td className="py-3 text-right pr-2">
                      <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-400">
                        <Heart size={10} className="fill-rose-400 shrink-0" />
                        {count} {count === 1 ? "save" : "saves"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wishlists Container */}
      <div className="space-y-6">
        {filteredWishlists.length > 0 ? (
          filteredWishlists.map(({ user, items }) => (
            <div
              key={user.id}
              className="rounded-2xl border border-white/[0.06] bg-[#0d0d16] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 hover:border-white/[0.1]"
            >
              {/* User Block Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05] mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-white/[0.08] overflow-hidden bg-white/[0.02] flex items-center justify-center shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} className="text-white/40" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                      {user.name}
                    </h3>
                    <p className="text-[10px] text-white/45 mt-0.5 flex items-center gap-1">
                      <Mail size={10} className="shrink-0 text-white/30" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-400">
                  <Heart size={10} className="fill-rose-400 shrink-0" />
                  {items.length} {items.length === 1 ? "Saved Item" : "Saved Items"}
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.02] flex items-center gap-3.5"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden shrink-0 relative flex items-center justify-center">
                      <img
                        src={resolveProductImage(getProductImage(item), item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                            "",
                            item.name,
                          );
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Tag size={9} className="text-white/30" />
                        <span className="text-[9px] text-white/40 uppercase tracking-wider truncate">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <p className="text-xs font-extrabold text-violet-400">
                          ₹{formatPrice(item.price)}
                        </p>
                        {item.isOnSale && item.originalPrice && (
                          <p className="text-[9px] text-white/30 line-through">
                            ₹{formatPrice(item.originalPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 border border-white/[0.04] bg-white/[0.01] rounded-2xl">
            <Heart className="h-6 w-6 text-white/20" />
            <div>
              <p className="text-sm font-semibold text-white/60">No wishlists found</p>
              <p className="text-xs text-white/35 mt-1">
                {searchQuery
                  ? "Try refining your search query."
                  : "Customers haven't saved any tools to their wishlists yet."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
