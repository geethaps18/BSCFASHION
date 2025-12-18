"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import LoadingRing from "@/components/LoadingRing";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function Shop() {
  const { products } = useInfiniteProducts(
    "shop",
    "/api/products?shop=true"
  );

  // 🔑 one-time loading
  const [initialLoading, setInitialLoading] = useState(true);

  // 🔥 turn off loader ONLY once products arrive
  useEffect(() => {
    if (products.length > 0) {
      setInitialLoading(false);
    }
  }, [products.length]);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 p-1 sm:p-6 pb-2">
        {/* ✅ One-time loader */}
        {initialLoading ? (
          <div className="flex justify-center items-center py-24">
            <LoadingRing />
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No products found.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-0.5 sm:gap-2">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
