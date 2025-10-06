import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WishlistProvider } from "./context/WishlistContext";
import { BagProvider } from "./context/BagContext";
import { AuthProvider } from "./context/AuthContext"; // fixed typo

import { Toaster } from "react-hot-toast";
import { SearchProvider } from "./context/SearchContext";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BSCFASHION",
  description: "B.S.CHANNABASAPPA & Sons",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <BagProvider>
            <WishlistProvider>
              {/* SplashLoader handles page loading */}
              
              <SearchProvider>
                <Toaster position="top-center" reverseOrder={false} />
                <main>{children}</main>
                </SearchProvider>
              
            </WishlistProvider>
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
