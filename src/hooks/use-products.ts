import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getProductImage } from "@/utils/product";

export {
  resolveProductImage,
  formatPrice,
  getAdjustmentStyle,
  getProductSpecificFallback,
} from "@/lib/utils";

export interface FirestoreProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[]; // Always a non-empty normalized array
  tag?: string | null;
  accent?: string;
  accentRgb?: string;
  active?: boolean;
  description?: string;
  originalPrice?: number;
  discountPercentage?: number;
  discountPercent?: number;
  isOnSale?: boolean;
  onSale?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  category?: string;
  stock?: number;
}

/**
 * Normalizes all image field variants into a clean string[].
 * Handles: images[] (new), image (legacy string), img (ProductCard legacy).
 */
function normalizeImages(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.images) && data.images.length > 0) {
    return (data.images as string[]).filter((img) => typeof img === "string" && img.trim() !== "");
  }
  if (typeof data.image === "string" && data.image.trim() !== "") {
    return [data.image];
  }
  if (typeof data.img === "string" && (data.img as string).trim() !== "") {
    return [data.img as string];
  }
  return [];
}

export function useProducts() {
  return useQuery<FirestoreProduct[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const productsColRef = collection(db, "products");
      const querySnapshot = await getDocs(productsColRef);
      const items: FirestoreProduct[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        let feat = !!data.isFeatured;
        let nw = !!data.isNew;

        if (data.tag) {
          const t = String(data.tag).toUpperCase();
          if (t === "FEATURED") feat = true;
          if (t === "NEW") nw = true;
        }

        const normalizedImages = normalizeImages(data);
        const imgUrl =
          normalizedImages[0] || getProductImage(data as Parameters<typeof getProductImage>[0]);

        items.push({
          id: docSnap.id,
          name: (data.name as string) || "",
          price: (data.price as number) ?? 0,
          image: imgUrl,
          images: normalizedImages,
          tag: (data.tag as string) || null,
          accent: data.accent as string | undefined,
          accentRgb: data.accentRgb as string | undefined,
          active: data.active !== false,
          description: (data.description as string) || "",
          originalPrice: data.originalPrice as number | undefined,
          discountPercentage:
            (data.discountPercentage as number) !== undefined
              ? (data.discountPercentage as number)
              : (data.discountPercent as number),
          discountPercent:
            (data.discountPercent as number) !== undefined
              ? (data.discountPercent as number)
              : (data.discountPercentage as number),
          isOnSale: (data.isOnSale as boolean) !== undefined ? !!data.isOnSale : !!data.onSale,
          onSale: (data.onSale as boolean) !== undefined ? !!data.onSale : !!data.isOnSale,
          isFeatured: feat,
          isNew: nw,
          category: (data.category as string) || "Gadgets",
          stock: data.stock !== undefined ? Number(data.stock) : 10,
        });
      });

      return items;
    },
    staleTime: 1000 * 60 * 5,
  });
}
