"use client";

import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function SearchPageInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";   // 🔥 SAFE FIX

  // 🔥 Infinite scroll hook (only one source of products)
  const { products } = useInfiniteProducts(
    `search-${q}`,
    `/api/search?q=${q}`
  );

  return (
    <main className="min-h-screen bg-white px-0.5 sm:px-6 lg:px-10 pt-20">
      <Header />

      {/* Search Title */}
      {q && (
        <div className="mt-0 mb-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-700">
            Results for <span className="font-bold text-black">"{q}"</span>
          </h1>
        </div>
      )}

      {/* No Query */}
      {!q && (
        <div className="mt-10 text-center text-gray-500">
          Type something to search 🔍
        </div>
      )}

      {/* No Results */}
      {q && products.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-10 space-y-3">
          <img
            src="/images/empty-search.png"
            alt="No results"
            className="w-60 h-60 object-contain opacity-80"
          />
          <p className="text-center text-gray-600 font-medium">
            No results found for{" "}
            <span className="font-semibold text-black">"{q}"</span>
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 px-5 py-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition"
          >
            Go Back Home 🏠
          </button>
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-3">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
