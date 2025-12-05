"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";



type ProductMin = {
  id: string;
  name: string;
  price: number;
  images?: string[];
  category?: string | null;
};

type SearchResult =
  | { kind: "recent"; text: string }
  | { kind: "suggestion"; text: string }
  | { kind: "product"; product: ProductMin }
  | { kind: "trending"; text: string };

const DEFAULT_TRENDING = [
  "Silk Saree",
  "Cotton Saree",
  "Men's Kurta",
  "Kids Wear",
  "Bedsheets",
  "Mats",
  "T-Shirts",
];


export default function SearchBar({
  initial = "",
  maxResults = 8,
  trending = DEFAULT_TRENDING,
  placeholder = "Search for products, brands and more",
  onSelect = (s: string | ProductMin) => {},
  disableOutsideClose = false,
  autoOpen = false,
}: {
  initial?: string;
  maxResults?: number;
  trending?: string[];
  placeholder?: string;
  onSelect?: (s: string | ProductMin) => void;
  disableOutsideClose?: boolean;
  autoOpen?: boolean;
}) {


  const [query, setQuery] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number>(-1);
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const isSearchPage = pathname.startsWith("/search");


  // recent searches
  const [recent, setRecent] = useState<string[]>(
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("recentSearches") || "[]")
      : []
  );

  useEffect(() => {
    // persist recent
    localStorage.setItem("recentSearches", JSON.stringify(recent.slice(0, 6)));
  }, [recent]);

  // click outside to close
useEffect(() => {
  const onDoc = (e: MouseEvent) => {
    if (!ref.current) return;

    // ❌ Do NOT close dropdown on Search page
    if (isSearchPage) return;

    // ✅ Close dropdown normally on other pages
    if (!ref.current.contains(e.target as Node)) {
      setOpen(false);
      setActive(-1);
    }
  };

  document.addEventListener("mousedown", onDoc);
  return () => document.removeEventListener("mousedown", onDoc);
}, [isSearchPage]);
 



  // debounce fetch
  useEffect(() => {
    if (!query) {
      // show recent + trending when empty
      const recents = recent.map((r) => ({ kind: "recent", text: r } as SearchResult));
      const trends = trending.map((t) => ({ kind: "trending", text: t } as SearchResult));
      setResults([...recents, ...trends]);
      if (!isSearchPage) setOpen(true);

      setLoading(false);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        // endpoint must return { suggestions?: string[], products?: ProductMin[] }
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        const suggestionResults: SearchResult[] =
          (data.suggestions || []).slice(0, 5).map((s: string) => ({ kind: "suggestion", text: s }));

        const productResults: SearchResult[] =
          (data.products || [])
            .slice(0, maxResults)
            .map((p: ProductMin) => ({ kind: "product", product: p }));

        // Merge: suggestions first, then products
        setResults([...suggestionResults, ...productResults]);
        if (!isSearchPage) setOpen(true);

        setActive(-1);
      } catch (err) {
        console.error("search error", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => clearTimeout(t);
  }, [query, recent, trending, maxResults]);

  const handleChooseSuggestion = (text: string) => {
    setQuery(text);
    saveRecent(text);
    setOpen(false);
    onSelect(text);
    // navigate to search results page
    window.location.href = `/search?q=${encodeURIComponent(text)}`;
  };

  const saveRecent = (text: string) => {
    setRecent((r) => {
      const nxt = [text, ...r.filter((x) => x !== text)].slice(0, 6);
      return nxt;
    });
  };

  const handleChooseProduct = (p: ProductMin) => {
    saveRecent(p.name);
    setOpen(false);
    onSelect(p);
    window.location.href = `/product/${p.id}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (!item) {
        // fallback: go to search page
        saveRecent(query);
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
        setOpen(false);
        return;
      }
      if (item.kind === "suggestion" || item.kind === "recent" || item.kind === "trending") {
        handleChooseSuggestion(item.text);
      } else if (item.kind === "product") {
        handleChooseProduct(item.product);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      <div
        className="flex items-center w-full border border-gray-300 rounded-full px-4 py-2 shadow-sm bg-white"
        onClick={() => {
          if (!isSearchPage) setOpen(true);

        }}
      >
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none">
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 ml-3 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
              setResults([]);
            }}
            className="text-gray-400 hover:text-gray-600 ml-2"
            aria-label="clear"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white  z-50 overflow-hidden">
          {/* Loading */}
          {loading && <div className="p-3 text-sm text-gray-500">Searching...</div>}

          {/* No results */}
          {!loading && results.length === 0 && query && (
            <div className="p-4 text-center text-sm text-gray-600">No results for “{query}”</div>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {results.map((item, idx) => {
                const isActive = idx === active;
                const baseClass = `flex items-center gap-3 px-3 py-2 cursor-pointer ${
                  isActive ? "bg-gray-100" : "hover:bg-gray-50"
                }`;

                if (item.kind === "recent") {
                  return (
                    <div
                      key={`recent-${idx}`}
                      className={baseClass}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => handleChooseSuggestion(item.text)}
                    >
                      <div className="text-xs text-gray-400">Recent</div>
                      <div className="flex-1 text-sm truncate">{item.text}</div>
                    </div>
                  );
                }

                if (item.kind === "trending") {
                  return (
                    <div
                      key={`trend-${idx}`}
                      className={baseClass}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => handleChooseSuggestion(item.text)}
                    >
                      <div className="text-xs text-red-500 font-semibold">🔥</div>
                      <div className="flex-1 text-sm truncate">{item.text}</div>
                      <div className="text-xs text-gray-400">Trending</div>
                    </div>
                  );
                }

                if (item.kind === "suggestion") {
                  return (
                    <div
                      key={`sug-${idx}`}
                      className={baseClass}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => handleChooseSuggestion(item.text)}
                    >
                      <div className="text-sm text-gray-700 flex-1 truncate">{item.text}</div>
                      <div className="text-xs text-gray-400">Search</div>
                    </div>
                  );
                }

                // product
                if (item.kind === "product") {
                  const p = item.product;
                  return (
                    <div
                      key={`prod-${p.id}`}
                      className={baseClass}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => handleChooseProduct(p)}
                    >
                      <div className="w-12 h-12 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-800 truncate">{p.name}</div>
                          {p.category && (
                            <div className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-600">
                              {p.category}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">₹{Number(p.price).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}

          {/* footer quick-actions when open and empty query */}
          {!query && (
            <div className="grid grid-cols-2 gap-2 p-3 border-t">
              <div>
                <div className="text-xs text-gray-500 mb-2">Trending</div>
                <div className="flex flex-wrap gap-2">
                  {trending.slice(0, 6).map((t) => (
                    <button
                      key={t}
                      className="text-xs bg-yellow-50 px-2 py-1 rounded text-yellow-700"
                      onClick={() => handleChooseSuggestion(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">Recent</div>
                <div className="flex flex-wrap gap-2">
                  {recent.length ? (
                    recent.map((r) => (
                      <button
                        key={r}
                        className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700"
                        onClick={() => handleChooseSuggestion(r)}
                      >
                        {r}
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">No recent searches</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
