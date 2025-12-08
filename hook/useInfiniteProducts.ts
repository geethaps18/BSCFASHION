"use client";

import { useEffect, useRef } from "react";
import { useInfiniteStore } from "@/store/infiniteStore";
import { usePathname } from "next/navigation";

export function useInfiniteProducts(key: string, apiUrl: string) {
  const {
    key: currentKey,
    products,
    page,
    scrollY,
    hasMore,
    reset,
    setProducts,
    addProducts,
    setPage,
    setScrollY,
    setHasMore,
  } = useInfiniteStore();

  const pathname = usePathname();

  // 🔥 Correct back navigation detection
  const previousPath = useRef(pathname);
  const isBackNav = pathname === previousPath.current;

  useEffect(() => {
    previousPath.current = pathname;
  }, [pathname]);

  const restoredRef = useRef(false);
  const isLoadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  /** RESET only when key changes (not on back) */
  useEffect(() => {
    if (currentKey !== key) {
      restoredRef.current = false;

      if (isBackNav) {
        console.log("🔙 Back navigation → keeping list");
        return;
      }

      console.log("🔄 New category → resetting");
      reset(key);
      setPage(1);
    }
  }, [key, currentKey, isBackNav, reset, setPage]);

  function buildUrl(p: number) {
    const sep = apiUrl.includes("?") ? "&" : "?";
    return `${apiUrl}${sep}page=${p}`;
  }

  async function loadPage(p: number) {
    if (isLoadingRef.current) return;
    if (!hasMore && p !== 1) return;

    isLoadingRef.current = true;

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch(buildUrl(p), { signal: ac.signal });
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const data = await res.json();
      const incoming = Array.isArray(data.products) ? data.products : [];

      if (p === 1) setProducts(incoming);
      else addProducts(incoming);

      setHasMore(Boolean(data.hasMore ?? incoming.length > 0));
    } catch (err: any) {
      if (err.name !== "AbortError") console.error("Load error:", err);
    } finally {
      isLoadingRef.current = false;
    }
  }

  useEffect(() => {
    loadPage(page);
  }, [page]);

  /** Infinite Scroll */
  useEffect(() => {
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 350;

      if (nearBottom && hasMore && !isLoadingRef.current) {
        setPage(page)
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore]);

  /** Save scroll */
  useEffect(() => {
    const save = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  /** Restore scroll */
  useEffect(() => {
    if (restoredRef.current) return;
    if (products.length === 0) return;

    const target = scrollY;

    function tryRestore() {
      if (document.body.scrollHeight < target + 200) {
        requestAnimationFrame(tryRestore);
        return;
      }
      restoredRef.current = true;
      window.scrollTo(0, target);
    }

    requestAnimationFrame(tryRestore);
  }, [products, scrollY]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { products };
}
