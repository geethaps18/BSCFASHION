"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import Header from "@/components/Header";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const HEADER_HEIGHT = 70;

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const data = await res.json();
        setResults(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        console.error("Search fetch error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <main
      className="min-h-screen bg-white px-4 sm:px-6 lg:px-10"
      style={{ paddingTop: HEADER_HEIGHT + 20 }}
    >
      {/* Search Info - only show if results > 0 */}
      {query && results.length > 0 && (
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-700 font-lora">
            {loading
              ? "Searching..."
              : `${results.length} ${
                  results.length === 1 ? "Result" : "Results"
                }`}{" "}
            for <span className="font-bold text-gray-900">"{query}"</span>
          </h1>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <p className="text-center text-gray-500 mt-20 animate-pulse">
          🔍 Searching for awesome stuff...
        </p>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="flex flex-col items-center justify-center mt-20 space-y-3">
          <img
            src="/images/empty-search.png"
            alt="No results"
            className="w-60 h-60 object-contain opacity-80"
          />
          <p className="text-center text-gray-600 font-medium">
            Oops! Nothing found for{" "}
            <span className="font-semibold text-black">"{query}"</span>
          </p>
          <p className="text-sm text-gray-500 italic">
            Maybe your product is chilling on vacation 🏝️
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 px-5 py-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition"
          >
            Go Back Home 🏠
          </button>
          <Header/>
        </div>
      )}

      {/* Product Grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5">
          {results.map((product) => (
            <div key={product.id} className="transition-transform">
              <ProductCard product={product} />
            </div>
          ))}
          <Header/>
        </div>
      )}
    </main>
  );
}
