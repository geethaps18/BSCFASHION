"use client";
import { create } from "zustand";

type InfiniteState = {
  key: string;
  products: any[];
  page: number;
  scrollY: number;
  hasMore: boolean;

  reset: (slug: string) => void;
  setProducts: (items: any[]) => void;
  addProducts: (items: any[]) => void;
  setPage: (page: number) => void;
  setScrollY: (y: number) => void;
  setHasMore: (value: boolean) => void;
};

export const useInfiniteStore = create<InfiniteState>((set) => ({
  key: "",
  products: [],
  page: 1,
  scrollY: 0,
  hasMore: true,

  reset: (slug) =>
    set({
      key: slug,
      products: [],
      page: 1,
      scrollY: 0,
      hasMore: true,
    }),

  setProducts: (items) => set({ products: items }),

  addProducts: (items) =>
    set((state) => ({
      products: [...state.products, ...items],
    })),

  setPage: (page) => set({ page }),

  setScrollY: (y) => set({ scrollY: y }),

  setHasMore: (value) => set({ hasMore: value }),
}));
