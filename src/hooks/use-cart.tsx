import React, { createContext, useContext, useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  deleteDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (product: Omit<CartItem, "quantity">) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  placeOrder: () => Promise<string | undefined>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, setAuthModalOpen } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Listen to Firestore cart subcollection in real-time
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    const cartColRef = collection(db, "users", user.uid, "cart");
    const unsubscribe = onSnapshot(
      cartColRef,
      (querySnapshot) => {
        const items: CartItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            productId: docSnap.id,
            name: data.name || "",
            price: data.price ?? 0,
            image: data.image || "",
            quantity: data.quantity ?? 1,
          });
        });
        setCartItems(items);
      },
      (error) => {
        console.error("Error listening to cart subcollection snapshot:", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const addToCart = async (product: Omit<CartItem, "quantity">) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (!product.productId) {
        console.error("addToCart: productId is required");
        return;
      }
      const itemDocRef = doc(db, "users", user.uid, "cart", product.productId);
      const itemSnap = await getDoc(itemDocRef);

      if (itemSnap.exists()) {
        const currentQty = itemSnap.data().quantity ?? 0;
        await setDoc(
          itemDocRef,
          {
            quantity: currentQty + 1,
          },
          { merge: true },
        );
      } else {
        await setDoc(itemDocRef, {
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
      }
      toast.success(`${product.name} added to bag`, {
        description: "Review details in your shopping bag.",
        duration: 2500,
      });
    } catch (error) {
      console.error("Error adding item to Firestore cart:", error);
      toast.error(`Failed to add ${product.name} to bag. Please try again.`);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      const itemDocRef = doc(db, "users", user.uid, "cart", productId);
      if (quantity <= 0) {
        await deleteDoc(itemDocRef);
      } else {
        await setDoc(
          itemDocRef,
          {
            quantity,
          },
          { merge: true },
        );
      }
    } catch (error) {
      console.error("Error updating cart item quantity in Firestore:", error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    const item = cartItems.find((i) => i.productId === productId);
    const name = item ? item.name : "Item";

    try {
      const itemDocRef = doc(db, "users", user.uid, "cart", productId);
      await deleteDoc(itemDocRef);
      toast.info(`${name} removed from bag`, {
        duration: 2000,
      });
    } catch (error) {
      console.error("Error removing item from Firestore cart:", error);
    }
  };

  const placeOrder = async (): Promise<string | undefined> => {
    if (!user || cartItems.length === 0) return;

    try {
      // Fetch fresh prices from 'products' collection to prevent price manipulation
      const fetchedItems = await Promise.all(
        cartItems.map(async (item) => {
          const productDocRef = doc(db, "products", item.productId);
          const productDocSnap = await getDoc(productDocRef);
          if (!productDocSnap.exists()) {
            throw new Error(`Product "${item.name}" was not found in our catalog.`);
          }
          const productData = productDocSnap.data();
          const freshPrice = productData.price ?? 0;
          return {
            productId: item.productId,
            name: productData.name || item.name,
            price: freshPrice,
            image: productData.image || item.image,
            quantity: item.quantity,
          };
        }),
      );

      const totalAmount = fetchedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const orderDocRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: fetchedItems,
        totalAmount,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Clear cart using batch delete
      const batch = writeBatch(db);
      cartItems.forEach((item) => {
        const itemRef = doc(db, "users", user.uid, "cart", item.productId);
        batch.delete(itemRef);
      });
      await batch.commit();

      toast.success("Order placed successfully!", {
        description: "Thank you for your purchase.",
        duration: 3000,
      });

      return orderDocRef.id;
    } catch (error) {
      console.error("Error placing order:", error);
      const message =
        error instanceof Error ? error.message : "Failed to place order. Please try again.";
      toast.error(message);
      throw error;
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
