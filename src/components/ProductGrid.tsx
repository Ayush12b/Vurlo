import { ProductCard } from "./ProductCard";
import { FirestoreProduct } from "@/hooks/use-products";
import { getProductImage } from "@/utils/product";

interface ProductGridProps {
  products: FirestoreProduct[];
  selectedProduct: FirestoreProduct | null;
  onSelectProduct: (product: FirestoreProduct) => void;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    images?: string[] | Record<string, string[]>;
    tag?: string | null;
    accent?: string;
    accentRgb?: string;
    originalPrice?: number;
    isOnSale?: boolean;
    onSale?: boolean;
    discountPercentage?: number;
    discountPercent?: number;
    isFeatured?: boolean;
    isNew?: boolean;
  }) => Promise<void>;
}

const ACCENT_PALETTES = [
  { accent: "#8a2eff", accentRgb: "138,46,255" }, // Brand Violet
  { accent: "#00e5ff", accentRgb: "0,229,255" }, // Brand Cyan
];

export function ProductGrid({
  products,
  selectedProduct,
  onSelectProduct,
  isWishlisted,
  toggleWishlist,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={{
            id: p.id,
            name: p.name,
            displayName: p.displayName,
            seoTitle: p.seoTitle,
            slug: p.slug,
            price: p.price,
            img: getProductImage(p),
            images: p.images,
            tag: p.tag || null,
            accent: p.accent || ACCENT_PALETTES[i % ACCENT_PALETTES.length].accent,
            accentRgb: p.accentRgb || ACCENT_PALETTES[i % ACCENT_PALETTES.length].accentRgb,
            description: p.description,
            originalPrice: p.originalPrice,
            discountPercentage: p.discountPercentage,
            discountPercent: p.discountPercent,
            isOnSale: p.isOnSale,
            onSale: p.onSale,
            isFeatured: p.isFeatured,
            isNew: p.isNew,
          }}
          index={i}
          isSelected={selectedProduct?.id === p.id}
          onSelect={() => onSelectProduct(p)}
          isWishlisted={isWishlisted}
          toggleWishlist={toggleWishlist}
        />
      ))}
    </div>
  );
}
