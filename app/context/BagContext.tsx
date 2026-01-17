"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "react-hot-toast";

// -------------------
// Types
// -------------------
export interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
  availableSizes?: string[];
}
export interface BagItem {
  id: string;
  product: Product;
  images: string[];
  size?: string | null;
  color?: string | null;
  variantId?: string | null;

  price: number;          // 🔥 ADD THIS

  quantity: number;
  uniqueKey: string;
}


interface BagContextType {
  bagItems: BagItem[];
  totalCount: number;
  subtotal: number;
  shipping: number;
  total: number;

  
addToCart: (
  product: Product,
  price: number,      // ✅ ADD THIS
  size?: string,
  color?: string,
  variantId?: string,
  images?: string[]
) => Promise<void>;


  removeFromCart: (uniqueKey: string) => Promise<void>;
  updateQuantity: (uniqueKey: string, quantity: number) => Promise<void>;
  updateSize: (uniqueKey: string, size: string) => Promise<void>;
  moveToWishlist: (uniqueKey: string) => Promise<void>;
  refreshBag: () => Promise<void>;
  setBagItems: (items: BagItem[]) => void;
   clearCart: () => Promise<void>;
}

// -------------------
// Context setup
// -------------------
const BagContext = createContext<BagContextType | undefined>(undefined);

// ✅ Hook to use context
export const useCart = (): BagContextType => {
  const context = useContext(BagContext);
  if (!context) throw new Error("useCart must be used within BagProvider");
  return context;
};

// -------------------
// Provider
// -------------------
interface BagProviderProps {
  children: ReactNode;
}

export const BagProvider = ({ children }: BagProviderProps) => {
  const [bagItems, setBagItems] = useState<BagItem[]>([]);

  // -------------------
  // Fetch bag from backend
  // -------------------
  const fetchBag = useCallback(async () => {
    try {
      const res = await fetch("/api/bag", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch bag");
      const data = await res.json();

      const itemsWithKey: BagItem[] = (data.items || []).map((item: any) => ({
        ...item,
        uniqueKey: `${item.product.id}-${item.size || "nosize"}-${item.color || "nocolor"}`,

      }));

      setBagItems(itemsWithKey);
    } catch (err) {
      console.error("Fetch bag error:", err);
      setBagItems([]);
    }
  }, []);

  useEffect(() => {
    fetchBag();
  }, [fetchBag]);

  // -------------------
  // Actions
  // -------------------
const addToCart = async (
  product: Product,
   price: number,
  size?: string,
  color?: string,
  variantId?: string,
  images: string[] = [] 
) => {

    if (product.availableSizes?.length && !size) {
      toast.error("Please select a size");
      return;
    }
    if (!variantId) {
  toast.error("Variant missing. Please select size and color.");
  return;
}

const uniqueKey = `${product.id}-${size || "default"}-${color || "nocolor"}`;

    const existingItem = bagItems.find((i) => i.uniqueKey === uniqueKey);

    if (existingItem) {
      await updateQuantity(uniqueKey, existingItem.quantity + 1);
      return;
    }

    try {
      await fetch("/api/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
body: JSON.stringify({
  productId: product.id,
  size,
  color,
  variantId,
  price, // 🔥 REQUIRED
  images,
}),



      });
      await fetchBag();
      toast.success("Added to bag");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to bag");
    }
  };
  const clearCart = async () => {
  try {
    // Remove all items from the cart
    await Promise.all(bagItems.map(item =>
      fetch("/api/bag", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bagId: item.id }),
      })
    ));
    setBagItems([]);
  } catch (err) {
    console.error(err);
    toast.error("Failed to clear cart");
  }
};


  const removeFromCart = async (uniqueKey: string) => {
    const item = bagItems.find((i) => i.uniqueKey === uniqueKey);
    if (!item) return;

    try {
      await fetch("/api/bag", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bagId: item.id }),
      });
      await fetchBag();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  const updateQuantity = async (uniqueKey: string, quantity: number) => {
    const item = bagItems.find((i) => i.uniqueKey === uniqueKey);
    if (!item) return;

    try {
      await fetch("/api/bag", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bagId: item.id, quantity }),
      });
      await fetchBag();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quantity");
    }
  };
  

  const updateSize = async (uniqueKey: string, newSize: string) => {
    const item = bagItems.find((i) => i.uniqueKey === uniqueKey);
    if (!item) return;

   const newUniqueKey = `${item.product.id}-${newSize}-${item.color || "nocolor"}`;

    const existingItem = bagItems.find((i) => i.uniqueKey === newUniqueKey);

    if (existingItem) {
      await updateQuantity(newUniqueKey, existingItem.quantity + item.quantity);
      await removeFromCart(uniqueKey);
      return;
    }

    try {
      await fetch("/api/bag", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
   body: JSON.stringify({
  bagId: item.id,
  size: newSize,
}),


      });
      await fetchBag();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update size");
    }
  };

  const moveToWishlist = async (uniqueKey: string) => {
    const item = bagItems.find((i) => i.uniqueKey === uniqueKey);
    if (!item) return;

    try {
      await removeFromCart(uniqueKey);
      toast.success("Moved to wishlist");
    } catch (err) {
      console.error(err);
      toast.error("Failed to move to wishlist");
    }
  };

  // -------------------
  // Derived values
  // -------------------
  const totalCount = useMemo(() => bagItems.reduce((acc: number, i: BagItem) => acc + i.quantity, 0), [bagItems]);

  const subtotal = useMemo(
  () => bagItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
  [bagItems]
);


  const shipping = useMemo(() => (subtotal > 1000 ? 0 : 100), [subtotal]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  // -------------------
  // Provider
  // -------------------
  return (
    <BagContext.Provider
      value={{
        bagItems,
        totalCount,
        subtotal,
        shipping,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSize,
        moveToWishlist,
        refreshBag: fetchBag,
        setBagItems,
        clearCart,
      }}
    >
      {children}
    </BagContext.Provider>
  );
};
