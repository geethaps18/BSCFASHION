"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./context/AuthContext";
import { BagProvider } from "./context/BagContext";
import { WishlistProvider } from "./context/WishlistContext";
import { SearchProvider } from "./context/SearchContext";

import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <BagProvider>
          <WishlistProvider>
            <SearchProvider>
            
              <Toaster position="top-center" reverseOrder={false} />
              {children}
            </SearchProvider>
          </WishlistProvider>
        </BagProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
