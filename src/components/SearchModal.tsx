import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Sparkles, Clock, CornerDownLeft, Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "@tanstack/react-router";
import { resolveProductImage } from "@/components/FeaturedProducts";
import { getProductImage } from "@/utils/product";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  active: boolean;
  description?: string;
  tags?: string[];
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [arrowActive, setArrowActive] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("vurlo-recent-searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Debounce input search query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Query and cache all products from Firestore when search is opened
  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["search-catalog-products"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      return querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            price: data.price ?? 0,
            image: getProductImage(data),
            images: data.images || [],
            category: data.category || "",
            active: data.active !== false,
            description: data.description || "",
            tags: Array.isArray(data.tags) ? data.tags : [],
          };
        })
        .filter((p) => p.active);
    },
    enabled: open,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Filter in-memory products by name, description, category, or tags
  const filteredProducts =
    debouncedQuery.trim() === ""
      ? []
      : allProducts?.filter((p) => {
          const queryTokens = debouncedQuery.toLowerCase().split(/\s+/).filter(Boolean);
          if (queryTokens.length === 0) return false;

          const nameLower = p.name.toLowerCase();
          const descLower = (p.description || "").toLowerCase();
          const catLower = (p.category || "").toLowerCase();
          const tagsLower = (p.tags || []).map((t) => t.toLowerCase());

          return queryTokens.some(
            (token: string) =>
              nameLower.includes(token) ||
              descLower.includes(token) ||
              catLower.includes(token) ||
              tagsLower.some((tag: string) => tag.includes(token))
          );
        }) || [];

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
    setArrowActive(false);
  }, [debouncedQuery]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  // Keypress listeners for escape key and scroll-lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Scroll locking
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Save successful search query to localStorage
  const saveRecentSearch = useCallback((queryStr: string) => {
    if (!queryStr.trim()) return;
    const cleanQuery = queryStr.trim();
    setRecentSearches((prev) => {
      const next = [cleanQuery, ...prev.filter((q) => q !== cleanQuery)].slice(0, 5);
      localStorage.setItem("vurlo-recent-searches", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSelectProduct = useCallback(
    (product: Product) => {
      saveRecentSearch(debouncedQuery || product.name);
      onClose();
      navigate({ to: "/", hash: `product-${product.id}` });
    },
    [debouncedQuery, onClose, navigate, saveRecentSearch],
  );

  const handleRecentSearchClick = (queryStr: string) => {
    setSearchQuery(queryStr);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    localStorage.removeItem("vurlo-recent-searches");
    setRecentSearches([]);
  };

  // Keyboard navigation logic
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setArrowActive(true);
        setSelectedIndex((prev) =>
          filteredProducts.length > 0 ? (prev + 1) % filteredProducts.length : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setArrowActive(true);
        setSelectedIndex((prev) =>
          filteredProducts.length > 0
            ? (prev - 1 + filteredProducts.length) % filteredProducts.length
            : 0,
        );
      } else if (e.key === "Enter") {
        if (arrowActive && filteredProducts[selectedIndex]) {
          e.preventDefault();
          handleSelectProduct(filteredProducts[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [open, filteredProducts, selectedIndex, handleSelectProduct, arrowActive]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 transition-all duration-300 ${
        open
          ? "opacity-100 visible bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          : "opacity-0 invisible pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg bg-black/90 border border-white/[0.08] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(138,46,255,0.12)] p-5 backdrop-blur-2xl transition-all duration-300 transform ${
          open ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              saveRecentSearch(searchQuery);
              onClose();
              navigate({ to: "/search", search: { q: searchQuery.trim() } });
            }
          }}
          className="relative flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search aesthetic lighting & decor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-violet-500/40 text-white rounded-xl placeholder:text-white/20 h-11 pl-10 pr-10 text-xs tracking-wide focus:outline-none transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:ring-2 focus:ring-violet-500/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/40 hover:text-white/80 transition-colors duration-200 px-1 cursor-pointer focus:outline-none"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-lg border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] text-white/50 hover:text-white transition duration-200 cursor-pointer focus:outline-none shrink-0"
            aria-label="Close search"
          >
            <X size={15} />
          </button>
        </form>

        {/* Suggested Searches / Recent / Results */}
        <div className="mt-5 max-h-[300px] overflow-y-auto pr-1 select-none custom-scrollbar">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              <p className="text-xs text-white/30">Searching catalog...</p>
            </div>
          )}

          {!isLoading && searchQuery.trim() === "" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                      <Clock size={11} />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[9px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleRecentSearchClick(q)}
                        className="text-[11px] font-semibold text-white/60 bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Essentials */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Popular Categories
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRecentSearchClick("RGB Lights")}
                    className="text-left text-xs font-semibold text-white/70 hover:text-white bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between"
                  >
                    <span>RGB Lights</span>
                    <ArrowRight size={12} className="text-white/30" />
                  </button>
                  <button
                    onClick={() => handleRecentSearchClick("Lamp")}
                    className="text-left text-xs font-semibold text-white/70 hover:text-white bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between"
                  >
                    <span>Ambient Lamps</span>
                    <ArrowRight size={12} className="text-white/30" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && searchQuery.trim() !== "" && (
            <div className="space-y-2.5">
              <div className="px-1 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Search Results
                </span>
                {filteredProducts.length > 0 && (
                  <span className="text-[9px] text-white/30 flex items-center gap-1">
                    Use Up/Down + Enter to select
                  </span>
                )}
              </div>

              {filteredProducts.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredProducts.map((p, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className={`flex items-center gap-3.5 p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-violet-500/10 border-violet-500/40 shadow-[0_0_15px_rgba(138,46,255,0.08)]"
                            : "bg-white/[0.01] border-white/[0.03] hover:border-white/[0.08]"
                        }`}
                      >
                        <img
                          src={resolveProductImage(getProductImage(p), p.name)}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-white/[0.02] border border-white/[0.05] shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                              "",
                              p.name,
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white/90 truncate">{p.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 truncate uppercase tracking-wider">
                            {p.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-violet-400">
                            ₹{p.price.toLocaleString("en-IN")}
                          </p>
                          {isSelected && (
                            <CornerDownLeft
                              size={11}
                              className="text-violet-400 animate-pulse shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-white/40 text-xs border border-white/[0.04] bg-white/[0.01] rounded-2xl animate-in fade-in duration-200">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
