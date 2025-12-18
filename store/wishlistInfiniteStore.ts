"use client";
import { create } from "zustand";

type WishlistInfiniteState = {
  products: any[];
  page: number;
  lastLoadedPage: number; // ✅ ADD THIS
  scrollY: number;
  hasMore: boolean;

  setProducts: (items: any[]) => void;
  addProducts: (items: any[]) => void;
  setPage: (page: number) => void;
  setLastLoadedPage: (page: number) => void; // ✅ ADD
  setScrollY: (y: number) => void;
  setHasMore: (value: boolean) => void;
  reset: () => void;
};


export const useWishlistInfiniteStore = create<WishlistInfiniteState>((set) => ({
  products: [],
  page: 1,
  lastLoadedPage: 1, // ✅ ADD
  scrollY: 0,
  hasMore: true,

  setProducts: (items) => set({ products: items }),

  addProducts: (items) =>
    set((state) => {
      const map = new Map(state.products.map((p) => [p.id, p]));
      items.forEach((item) => map.set(item.id, item));
      return { products: Array.from(map.values()) };
    }),

  setPage: (page) => set({ page }),
  setLastLoadedPage: (page) => set({ lastLoadedPage: page }), // ✅ ADD
  setScrollY: (y) => set({ scrollY: y }),
  setHasMore: (value) => set({ hasMore: value }),

  reset: () =>
    set({
      products: [],
      page: 1,
      lastLoadedPage: 1, // ✅ RESET IT
      scrollY: 0,
      hasMore: true,
    }),
}));
