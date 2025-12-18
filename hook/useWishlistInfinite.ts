"use client";

import { useEffect, useRef } from "react";
import { useWishlistInfiniteStore } from "@/store/wishlistInfiniteStore";

export function useWishlistInfinite() {
  const {
    products,
    page,
    lastLoadedPage,
    scrollY,
    hasMore,
    setProducts,
    addProducts,
    setPage,
    setScrollY,
    setHasMore,
    setLastLoadedPage
  } = useWishlistInfiniteStore();

  const loadingRef = useRef(false);
  const restoredRef = useRef(false);
  const pageRef = useRef(page);
    useEffect(() => {
  if (lastLoadedPage > 1) {
    setPage(lastLoadedPage);
    pageRef.current = lastLoadedPage;
  }
}, []);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const loadPage = async (p: number) => {
    if (loadingRef.current || !hasMore) return;
setLastLoadedPage(p);

    loadingRef.current = true;

    try {
      const res = await fetch(`/api/wishlist?page=${p}`);
      const data = await res.json();

      const incoming = data.products || [];

      if (p === 1 && products.length === 0) {
        setProducts(incoming);
      } else {
        addProducts(incoming);
      }

      setHasMore(Boolean(data.hasMore));
    } finally {
      loadingRef.current = false;
    }
  };
  



  // initial + pagination
  useEffect(() => {
    loadPage(page);
  }, [page]);

  // infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300;

      if (nearBottom) {
        const next = pageRef.current + 1;
        pageRef.current = next;
        setPage(next);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore]);

  // save scroll
  useEffect(() => {
    const save = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  // restore scroll
  useEffect(() => {
    if (restoredRef.current || !products.length) return;

    const restore = () => {
      if (document.body.scrollHeight < scrollY + 200) {
        requestAnimationFrame(restore);
        return;
      }
      restoredRef.current = true;
      window.scrollTo(0, scrollY);
    };

    requestAnimationFrame(restore);
  }, [products]);

  return { products };
}
