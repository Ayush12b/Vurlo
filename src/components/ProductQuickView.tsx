import { useState } from "react";
import { ShoppingBag, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { resolveProductImage, formatPrice, FirestoreProduct } from "@/hooks/use-products";
import { getProductImage } from "@/utils/product";

interface ProductQuickViewProps {
  product: FirestoreProduct;
  onClose: () => void;
}

export function ProductQuickView({ product: selectedProduct, onClose }: ProductQuickViewProps) {
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);

  // Pre-resolve all images at render time — no raw unresolved paths ever reach <img src>
  const resolvedImages: string[] = (() => {
    const arr: string[] = [];
    if (Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0) {
      selectedProduct.images.forEach((img) => {
        const resolved = resolveProductImage(img, selectedProduct.name);
        if (resolved && !arr.includes(resolved)) arr.push(resolved);
      });
    }
    if (arr.length === 0) {
      arr.push(resolveProductImage(getProductImage(selectedProduct), selectedProduct.name));
    }
    return arr;
  })();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentImage = resolvedImages[currentImageIndex] ?? resolvedImages[0];

  // Guard: never render with invalid product
  if (!selectedProduct || !selectedProduct.id) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d16] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8),0_0_50px_rgba(138,46,255,0.08)] flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
        style={
          {
            "--accent": selectedProduct.accent || "#8a2eff",
            "--accent-rgb": selectedProduct.accentRgb || "138,46,255",
          } as React.CSSProperties
        }
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-xl bg-black/40 border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] text-white/50 hover:text-white transition duration-200 cursor-pointer focus:outline-none"
          aria-label="Close details"
        >
          <X size={15} />
        </button>

        {/* Product Image Section */}
        <div className="w-full md:w-1/2 aspect-square relative bg-white/[0.01] border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col p-6">
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div
              className="absolute w-[80%] h-[80%] rounded-full opacity-30 blur-[40px] pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(var(--accent-rgb), 0.15) 0%, transparent 70%)`,
              }}
            />
            <img
              src={currentImage}
              alt={selectedProduct.name}
              className="max-w-full max-h-full object-contain relative z-10 rounded-xl"
              key={currentImageIndex}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                  "",
                  selectedProduct.name,
                );
              }}
            />
          </div>

          {/* Thumbnails — only when multiple distinct resolved images exist */}
          {resolvedImages.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 overflow-x-auto py-1">
              {resolvedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border shrink-0 bg-white/[0.02] transition-all duration-200 cursor-pointer focus:outline-none ${
                    idx === currentImageIndex
                      ? "border-violet-500 scale-105 shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                      : "border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${selectedProduct.name} - Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = resolveProductImage(
                        "",
                        selectedProduct.name,
                      );
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {selectedProduct.stock === 0 ? (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/25 text-red-400">
                  Sold Out
                </span>
              ) : (
                <>
                  {selectedProduct.isOnSale && selectedProduct.discountPercentage && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/25 text-red-400">
                      Sale
                    </span>
                  )}
                  {selectedProduct.isNew && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                      New
                    </span>
                  )}
                  {selectedProduct.isFeatured && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/25 text-violet-400">
                      Featured
                    </span>
                  )}
                </>
              )}
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
              {selectedProduct.name}
            </h3>
            <div className="flex items-baseline gap-2">
              <p
                className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300"
                style={{ textShadow: `0 0 20px rgba(var(--accent-rgb), 0.2)` }}
              >
                ₹{formatPrice(selectedProduct.price)}
              </p>
              {selectedProduct.isOnSale && selectedProduct.originalPrice && (
                <p className="text-xs text-white/30 line-through font-semibold">
                  ₹{formatPrice(selectedProduct.originalPrice)}
                </p>
              )}
            </div>
            <div className="h-[1px] bg-white/[0.06]" />
            <p className="text-xs text-gray-400 leading-relaxed">
              {selectedProduct.description ||
                "Premium quality workspace accessory designed to enhance your desk setup."}
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-white/[0.06]">
            <button
              disabled={addingToCart || selectedProduct.stock === 0}
              onClick={async () => {
                if (addingToCart || selectedProduct.stock === 0) return;
                setAddingToCart(true);
                try {
                  await addToCart({
                    productId: selectedProduct.id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    image: getProductImage(selectedProduct),
                  });
                  onClose();
                } catch (err) {
                  toast.error("Failed to add to cart");
                } finally {
                  setAddingToCart(false);
                }
              }}
              className={`w-full text-xs font-bold uppercase tracking-wider h-11 rounded-xl text-white transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2 ${
                selectedProduct.stock === 0
                  ? "opacity-50 pointer-events-none cursor-not-allowed bg-neutral-800"
                  : ""
              }`}
              style={
                selectedProduct.stock === 0
                  ? { background: "#1f1f2e", border: "1px solid rgba(255,255,255,0.06)" }
                  : { background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)" }
              }
            >
              {addingToCart ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding to Cart...</span>
                </>
              ) : selectedProduct.stock === 0 ? (
                <span>Sold Out</span>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
