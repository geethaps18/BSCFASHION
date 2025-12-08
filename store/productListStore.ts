"use client";
import { create } from "zustand";

type ProductListState = {
  products: any[];
  page: number;
  scrollY: number;
  hasMore: boolean;
  setProducts: (items: any[]) => void;
  addProducts: (items: any[]) => void;
  setPage: (page: number) => void;
  setScrollY: (y: number) => void;
  setHasMore: (value: boolean) => void;
};

export const useProductListStore = create<ProductListState>((set) => ({
  products: [],
  page: 1,
  scrollY: 0,
  hasMore: true,

  setProducts: (items) => set({ products: items }),
  addProducts: (items) =>
    set((state) => ({ products: [...state.products, ...items] })),
  setPage: (page) => set({ page }),
  setScrollY: (y) => set({ scrollY: y }),
  setHasMore: (value) => set({ hasMore: value }),
}));
