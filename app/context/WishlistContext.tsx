"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  images?: string[];
  category?: string;
  createdAt: string;
}

interface WishlistContextType {
  wishlist: Product[];
  setWishlist: React.Dispatch<React.SetStateAction<Product[]>>;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (product: Product) => Promise<void>;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSignedIn } = useUser();
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Fetch wishlist on login
  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setWishlist([]);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await fetch(`/api/wishlist?userId=${user.id}`);
        const data = await res.json();

        const sortedProducts = (data.products || []).sort(
          (a: Product, b: Product) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setWishlist(sortedProducts);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch wishlist");
      }
    };

    fetchWishlist();
  }, [isSignedIn, user?.id]);

  // ✅ helper to check if product is in wishlist
  const isInWishlist = (id: string) => wishlist.some((p) => p.id === id);

  // Toggle product (add/remove)
  const toggleWishlist = async (product: Product) => {
    if (!isSignedIn || !user?.id) {
      toast.error("Please login first!");
      return;
    }

    const alreadyLiked = isInWishlist(product.id);

    setWishlist((prev) =>
      alreadyLiked ? prev.filter((p) => p.id !== product.id) : [product, ...prev]
    );

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        // revert
        setWishlist((prev) =>
          alreadyLiked ? [...prev, product] : prev.filter((p) => p.id !== product.id)
        );
        toast.error(data.error || "Failed to update wishlist");
      } else {
        toast.success(alreadyLiked ? "Removed from wishlist" : "Added to wishlist");
      }
    } catch (err) {
      console.error(err);
      setWishlist((prev) =>
        alreadyLiked ? [...prev, product] : prev.filter((p) => p.id !== product.id)
      );
      toast.error("Error updating wishlist");
    }
  };

  // Remove product permanently
  const removeFromWishlist = async (product: Product) => {
    if (!isSignedIn || !user?.id) {
      toast.error("Please login first!");
      return;
    }

    setWishlist((prev) => prev.filter((p) => p.id !== product.id));

    try {
      const res = await fetch("/api/wishlist/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setWishlist((prev) => [...prev, product]);
        toast.error(data.error || "Failed to remove from wishlist");
      } else {
        toast.success("Removed from wishlist");
      }
    } catch (err) {
      console.error(err);
      setWishlist((prev) => [...prev, product]);
      toast.error("Error removing product");
    }
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, setWishlist, toggleWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
