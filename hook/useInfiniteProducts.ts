"use client";

import { useEffect, useRef } from "react";
import { useInfiniteStore } from "@/store/useInfiniteStore";

export function useInfiniteProducts(key: string, apiUrl: string) {
  const {
    key: currentKey,
    products,
    page,
    lastLoadedPage,
    scrollY,
    hasMore,
    reset,
    setProducts,
    addProducts,
    setPage,
    setScrollY,
    setHasMore,
    setLastLoadedPage,
  } = useInfiniteStore();

  const loadingRef = useRef(false);
  const restoredRef = useRef(false);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // 🔄 Reset ONLY when feed key changes
  useEffect(() => {
    if (currentKey !== key) {
      reset(key);
    }
  }, [key, currentKey, reset]);

  const buildUrl = (p: number) => {
    const sep = apiUrl.includes("?") ? "&" : "?";
    return `${apiUrl}${sep}page=${p}`;
  };

  const loadPage = async (p: number) => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;

    try {
      const res = await fetch(buildUrl(p));
      const data = await res.json();
      const incoming = data.products ?? [];

      if (p === 1 && products.length === 0) {
        setProducts(incoming);
      } else {
        addProducts(incoming);
      }

      setLastLoadedPage(p);
      setHasMore(Boolean(data.hasMore));
      
    } finally {
      loadingRef.current = false;
    }
  };

  // 🚀 Fetch when page changes
  useEffect(() => {
    loadPage(page);
  }, [page]);

  // ♾ Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (loadingRef.current || !hasMore) return;

      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300
      ) {
        const next = pageRef.current + 1;
        pageRef.current = next;
        setPage(next);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, setPage]);

  // 💾 Save scroll
  useEffect(() => {
    const save = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [setScrollY]);

  // 🔁 Restore page FIRST
  useEffect(() => {
    if (lastLoadedPage > 1) {
      setPage(lastLoadedPage);
      pageRef.current = lastLoadedPage;
    }
  }, []);

  // 🔁 Restore scroll AFTER products exist
  useEffect(() => {
    if (restoredRef.current || !products.length) return;
    restoredRef.current = true;
    window.scrollTo(0, scrollY);
  }, [products, scrollY]);

  return { products };
}
