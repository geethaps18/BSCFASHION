import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { WishlistProvider } from "./context/WishlistContext";
import { BagProvider } from "./context/BagContext";
import { AuthProvider } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import Script from "next/script";

import { Toaster } from "react-hot-toast";
import PolicyFooter from "@/components/PolicyFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "B.S. Channabasappa & Sons — Trusted since 1938.",
  description: "B.S. Channabasappa & Sons — Est. 1938 | Sarees, Men’s Wear, Kids, and Home.",
  icons: {
    icon: "/images/logo.png", // ✅ this is your favicon/logo path
  },
  openGraph: {
    title: "BSCFASHION",
    description: "B.S. Channabasappa & Sons — Trusted since 1938.",
    url: "https://www.bscfashion.in",
    siteName: "BSCFASHION",
    images: [
      {
        url: "/images/logo.png", // ✅ same logo for social sharing (OG image)
        width: 800,
        height: 800,
        alt: "BSCFASHION Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
  
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        <AuthProvider>
          <BagProvider>
            <WishlistProvider>
              <SearchProvider>
  
<Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="afterInteractive"
/>

               
                <Toaster position="top-center" reverseOrder={false} />
                <main className="min-h-screen">{children}
                   <PolicyFooter/>
                </main>
              </SearchProvider>
            </WishlistProvider>
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
