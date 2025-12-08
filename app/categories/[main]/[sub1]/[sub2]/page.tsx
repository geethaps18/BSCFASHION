"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { categories, SubCategory } from "@/data/categories";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function Sub2Page() {
  const { main, sub1, sub2 } = useParams();
  const mainSlug = Array.isArray(main) ? main[0] : main;
  const sub1Slug = Array.isArray(sub1) ? sub1[0] : sub1;
  const sub2Slug = Array.isArray(sub2) ? sub2[0] : sub2;

  // 🔥 HOOK FIRST (important)
  const key = `sub2-${mainSlug}-${sub1Slug}-${sub2Slug}`;
  const apiURL = `/api/products?main=${mainSlug}&sub1=${sub1Slug}&sub2=${sub2Slug}`;
  const { products } = useInfiniteProducts(key, apiURL);

  // Validate path AFTER hook
  if (!mainSlug || !sub1Slug || !sub2Slug) {
    return <div className="p-8 text-center text-red-600">Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-white pt-15 pb-20 px-0">
      <Header />

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-0.5">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Footer />
    </div>
  );
}
