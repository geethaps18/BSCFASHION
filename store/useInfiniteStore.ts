"use client";
import { create } from "zustand";

type InfiniteState = {
  key: string;
  products: any[];
  page: number;
  lastLoadedPage: number;
  scrollY: number;
  hasMore: boolean;

  reset: (slug: string) => void;
  setProducts: (items: any[]) => void;
  addProducts: (items: any[]) => void;
  setPage: (page: number) => void;
  setScrollY: (y: number) => void;
  setHasMore: (value: boolean) => void;
  setLastLoadedPage: (p: number) => void;
};

export const useInfiniteStore = create<InfiniteState>((set) => ({
  key: "",
  products: [],
  page: 1,
  lastLoadedPage: 1,
  scrollY: 0,
  hasMore: true,

  reset: (slug) =>
    set({
      key: slug,
      products: [],
      page: 1,
      lastLoadedPage: 1,
      scrollY: 0,
      hasMore: true,
    }),

  setProducts: (items) => set({ products: items }),

  addProducts: (items) =>
    set((state) => {
      const map = new Map(state.products.map((p) => [p.id, p]));
      items.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      return { products: Array.from(map.values()) };
    }),

  setPage: (page) => set({ page }),

  setLastLoadedPage: (p) => set({ lastLoadedPage: p }),

  setScrollY: (y) => set({ scrollY: y }),

  setHasMore: (value) => set({ hasMore: value }),
}));
