"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "react-hot-toast";
import { getCookie } from "cookies-next";

export interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  images?: string[];
  availableSizes?: string[];
  size?: string;
}

interface WishlistContextType {
  wishlistItems: WishlistProduct[]; // required for Header
  wishlist: WishlistProduct[];
  toggleWishlist: (product: WishlistProduct, options?: { soft?: boolean }) => Promise<void>;
  isInWishlist: (id: string) => boolean;
  fetchWishlist: () => Promise<void>;
  userLoggedIn: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  // Fetch wishlist from API
  const fetchWishlist = async () => {
    try {
      const token = getCookie("token");
if (!token || typeof token !== "string") {
  setWishlist([]);
  setUserLoggedIn(false);
  return;
}

try {
  const part = token.split(".")[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  JSON.parse(
    decodeURIComponent(
      atob(part)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
  );
} catch (err) {
  console.error("JWT invalid:", err);
  setWishlist([]);
  setUserLoggedIn(false);
  return;
}


      const res = await fetch("/api/wishlist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json();
      setWishlist(data.products || []);
      setUserLoggedIn(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch wishlist");
      setWishlist([]);
      setUserLoggedIn(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const isInWishlist = (id: string) => wishlist.some((p) => p.id === id);

  const toggleWishlist = async (product: WishlistProduct, options?: { soft?: boolean }) => {
    const liked = isInWishlist(product.id);

    if (!options?.soft) {
      // Optimistic UI update
      setWishlist((prev) => (liked ? prev.filter((p) => p.id !== product.id) : [product, ...prev]));
    }

    try {
      const token = getCookie("token");
      if (!token) throw new Error("User not logged in");

      await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

     
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");

      if (!options?.soft) {
        // revert optimistic UI
        setWishlist((prev) => (liked ? [product, ...prev] : prev.filter((p) => p.id !== product.id)));
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistItems: wishlist, // ✅ added this to fix TS error
        toggleWishlist,
        isInWishlist,
        fetchWishlist,
        userLoggedIn,
      }}
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
