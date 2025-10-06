"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category?: string;
}

interface SearchResult {
  type: "suggestion" | "product" | "recent";
  name: string;
  product?: Product;
}

// ------------------- Highlight search query -------------------
function highlightText(text: string, query: string) {
  if (!text || !query) return text;
  const words = query.split(/\s+/).filter(Boolean);
  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
      <span key={idx} className="bg-yellow-200 rounded px-0.5">{part}</span>
    ) : (
      part
    )
  );
}

// ------------------- SearchBar Component -------------------
export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // ------------------- Load recent searches -------------------
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  // ------------------- Save to recent searches -------------------
  const saveRecentSearch = (term: string) => {
    let updated = [term, ...recentSearches.filter((r) => r !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  // ------------------- Fetch suggestions & products -------------------
  useEffect(() => {
    if (!query) {
      // show recent searches when query is empty
      setResults(recentSearches.map((r) => ({ type: "recent", name: r })));
      setShowDropdown(true);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        const suggestionResults: SearchResult[] = (data.suggestions || []).map((s: string) => ({
          type: "suggestion",
          name: s,
        }));

        const productResults: SearchResult[] = (data.products || []).map((p: Product) => ({
          type: "product",
          name: p.name,
          product: p,
        }));

        setResults([...suggestionResults, ...productResults]);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query, recentSearches]);

  // ------------------- Close dropdown on outside click -------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------- Keyboard navigation -------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex];
      if (item) {
        if (item.type === "suggestion" || item.type === "recent") {
          saveRecentSearch(item.name);
          window.location.href = `/search?q=${encodeURIComponent(item.name)}`;
        } else if (item.type === "product" && item.product) {
          window.location.href = `/products/${item.product.id}`;
        }
        setShowDropdown(false);
      }
    }
  };

  return (
    <div className="relative w-full sm:w-96" ref={dropdownRef}>
      <input
        type="text"
        value={query}
        placeholder="Search products..."
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 bg-white border mt-1 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && <p className="p-2 text-gray-500">Searching...</p>}

          {!loading && results.length === 0 && query && (
            <p className="p-2 text-gray-500">
              No results found for "<span className="font-semibold">{query}</span>"
            </p>
          )}

          {!loading &&
            results.map((item, idx) => (
              <Link
                key={`${item.type}-${idx}`}
                href={
                  item.type === "suggestion" || item.type === "recent"
                    ? `/search?q=${encodeURIComponent(item.name)}`
                    : `/products/${item.product?.id}`
                }
                className={`flex items-center p-2 hover:bg-gray-100 cursor-pointer ${
                  idx === activeIndex ? "bg-green-100" : ""
                }`}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  if (item.type !== "product") saveRecentSearch(item.name);
                  setShowDropdown(false);
                }}
              >
                {item.type === "product" && item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0] || "/placeholder.png"}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover mr-2 rounded"
                  />
                )}
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium truncate">
                    {highlightText(item.name, query)}
                  </span>
                  {item.type === "product" && item.product?.category && (
                    <span className="text-gray-500 text-xs">
                      {highlightText(item.product.category, query)}
                    </span>
                  )}
                  {item.type === "product" && (
                    <span className="text-green-600 font-semibold mt-1">
                      ₹{item.product?.price}
                    </span>
                  )}
                  {item.type === "recent" && (
                    <span className="text-gray-400 text-xs">Recent Search</span>
                  )}
                </div>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
