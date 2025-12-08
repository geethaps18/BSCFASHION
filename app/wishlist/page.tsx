"use client";

import React, { useCallback, useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import {
  readPending,
  writePending,
  clearPending,
} from "@/utils/wishlistPending";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([]);
  const pathname = usePathname();
  const { products } = useInfiniteProducts("wishlist", "/api/wishlist");


  // --- decode token once on mount
  useEffect(() => {
    const token = getCookie("token");
    if (!token || typeof token !== "string") {
      setUserId(null);
      setLoading(false);
      return;
    }
    try {
  const base64 = token.split(".")[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  const payload = JSON.parse(json);

  setUserId(
    payload.userId ||
    payload.id ||
    payload._id ||
    payload.user ||
    payload.uid ||
    null
  );
} catch (err) {
  console.error("JWT decode failed:", err);
  setUserId(null);

    } finally {
      setLoading(false);
    }
  }, []);

  // --- fetch wishlist from server
  const fetchWishlist = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = getCookie("token");
      const res = await fetch("/api/wishlist", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setWishlist(data.products || []);
    } catch (err) {
      console.error("Wishlist fetch error:", err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchWishlist();
  }, [userId, fetchWishlist]);

  // --- load pendingRemovals from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPendingRemovals(readPending());
  }, []);

  // --- sync pendingRemovals across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "bsc_wishlist_pending_removals_v1") {
        try {
          setPendingRemovals(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
          setPendingRemovals([]);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // --- process pending removals
  const processRemovals = useCallback(async () => {
    const stored = readPending();
    if (!stored || stored.length === 0) return;

    try {
      const token = getCookie("token");
      const res = await fetch("/api/wishlist/delete-many", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: stored }),
        keepalive: true,
      });

      if (!res.ok) {
        console.error("Bulk delete failed", res.status);
        return;
      }

      clearPending();
      setPendingRemovals([]);
      await fetchWishlist();
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  }, [fetchWishlist]);

  // --- call processRemovals when user navigates to /wishlist
  useEffect(() => {
    if (pathname === "/wishlist") {
      processRemovals();
    }
  }, [pathname, processRemovals]);

  // --- beforeunload fallback
  useEffect(() => {
    const handleBeforeUnload = () => {
      const stored = readPending();
      if (!stored || stored.length === 0) return;

      try {
        const token = getCookie("token");
        fetch("/api/wishlist/delete-many", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productIds: stored }),
          keepalive: true,
        });
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // --- heart click
  const handleHeartClick = (product: Product) => {
    const isPending = pendingRemovals.includes(product.id);
    const isInList = wishlist.some((p) => p.id === product.id);

    if (isInList) {
      const next = isPending
        ? pendingRemovals.filter((id) => id !== product.id)
        : [...pendingRemovals, product.id];
      setPendingRemovals(next);
      writePending(next);
    } else {
      setWishlist((prev) => [...prev, product]);
      const next = pendingRemovals.filter((id) => id !== product.id);
      setPendingRemovals(next);
      writePending(next);
    }
  };

  // --- UI
  if (loading) return <p className="mt-20 text-center">Loading wishlist...</p>;

  if (!userId)
    return (
      <p className="mt-20 text-center">
        Please login to see your wishlist.
        <Link
          href={`/login?redirect=${encodeURIComponent(pathname)}`}
          className="text-yellow-500 ml-2"
        >
          Login
        </Link>
      </p>
    );

  if (wishlist.length === 0)
    return (
      <div className="flex flex-col items-center justify-center mt-20 text-center">
        <img src="/images/empty-wishlist.png" className="w-80 h-80 mb-6" />
        <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
        <Link
          href="/"
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
        >
          Add Products You Love
        </Link>
      </div>
    );

  return (
    <main className="flex-grow  min-h-screen">
      {/* ✅ Header always visible */}
      <Header />

      {/* ✅ Added pt-20 so grid doesn’t overlap with header */}
      <div className="pt-18 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5">
        {wishlist.map((product) => {
          const isPendingRemove = pendingRemovals.includes(product.id);
          return (
            <ProductCard
              key={product.id}
              product={product}
              wishlist={!isPendingRemove}
              onWishlistToggle={() => handleHeartClick(product)}
            />
          );
        })}
      </div>
    </main>
  );
}
