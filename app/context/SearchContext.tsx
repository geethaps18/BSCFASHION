// app/context/SearchContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/types/product";

export type SearchResult = {
  type: "recent" | "suggestion" | "product";
  name: string;
  product?: Product;
};

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  recentSearches: string[];
  updateRecentSearch: (term: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
};

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const updateRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((r) => r !== term)].slice(0, 5);
      return updated;
    });
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchResults,
        recentSearches,
        updateRecentSearch,
        setSearchResults,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
