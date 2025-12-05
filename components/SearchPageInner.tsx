"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";


export default function SearchPageInner() {
  const searchParams = useSearchParams();

  // ✅ Correct param name (SearchBar uses ?q=)
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  const isSearchPage = pathname.startsWith("/search");


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
          body: JSON.stringify({ q: query }), // IMPORTANT
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
      className="min-h-screen bg-white px-0.5 sm:px-6 lg:px-10 pt-20"
    
    >
      <Header />

      {/* Search Info */}
      {query && results.length > 0 && (
        <div className="mt-0 mb-0.5">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-700">
            {loading
              ? "Searching..."
              : `${results.length} ${results.length === 1 ? "Result" : "Results"}`}
            {"  "}for{" "}
            <span className="font-bold text-gray-900">"{query}"</span>
          </h1>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-center text-gray-500 mt-20 animate-pulse">
          🔍 Searching for awesome stuff...
        </p>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="flex flex-col items-center justify-center mt-10 space-y-3">
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
        </div>
      )}

      {/* Product Grid */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5 sm:gap-2 gap-x-1 gap-y-0 ">
          {results.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
