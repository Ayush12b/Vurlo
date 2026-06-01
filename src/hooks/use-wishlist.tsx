import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, collection, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { getProductImage } from "@/utils/product";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  tag?: string | null;
  accent?: string;
  accentRgb?: string;
  originalPrice?: number;
  isOnSale?: boolean;
  discountPercentage?: number;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  toggleWishlist: (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    images?: string[];
    tag?: string | null;
    accent?: string;
    accentRgb?: string;
    originalPrice?: number;
    isOnSale?: boolean;
    discountPercentage?: number;
  }) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, setAuthModalOpen } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  // Listen to Firestore wishlist subcollection in real-time
  useEffect(() => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    const wishlistColRef = collection(db, "users", user.uid, "wishlist");
    const unsubscribe = onSnapshot(
      wishlistColRef,
      (querySnapshot) => {
        const items: WishlistItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const imgUrl = getProductImage(data);
          items.push({
            productId: docSnap.id,
            name: data.name || "",
            price: data.price ?? 0,
            image: imgUrl,
            images: Array.isArray(data.images) ? data.images : data.image ? [data.image] : [],
            tag: data.tag || null,
            accent: data.accent || "",
            accentRgb: data.accentRgb || "",
            originalPrice: data.originalPrice,
            isOnSale: data.isOnSale || false,
            discountPercentage: data.discountPercentage || 0,
          });
        });
        setWishlistItems(items);
      },
      (error) => {
        console.error("Error listening to wishlist collection snapshot:", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const toggleWishlist = async (product: {
    id: string;
    name: string;
    price: number;
    image: string;
    images?: string[];
    tag?: string | null;
    accent?: string;
    accentRgb?: string;
    originalPrice?: number;
    isOnSale?: boolean;
    discountPercentage?: number;
  }) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const exists = wishlistItems.some((item) => item.productId === product.id);
    const itemDocRef = doc(db, "users", user.uid, "wishlist", product.id);

    try {
      if (exists) {
        await deleteDoc(itemDocRef);
        toast.success("Removed from wishlist", {
          description: `${product.name} has been removed.`,
        });
      } else {
        await setDoc(itemDocRef, {
          name: product.name,
          price: product.price,
          image: getProductImage(product),
          images: product.images || [product.image],
          tag: product.tag || null,
          accent: product.accent || "",
          accentRgb: product.accentRgb || "",
          originalPrice: product.originalPrice || product.price,
          isOnSale: product.isOnSale || false,
          discountPercentage: product.discountPercentage || 0,
        });
        toast.success("Added to wishlist", {
          description: `${product.name} added to your wishlist.`,
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist item in Firestore:", error);
      toast.error("Failed to update wishlist. Please try again.");
    }
  };

  const isWishlisted = (productId: string) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
