export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import PolicyFooter from "@/components/PolicyFooter";
import Providers from "./providers";
import DesktopFooter from "@/components/DesktopFooter";

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
  description:
    "B.S. Channabasappa & Sons — Est. 1938 | Sarees, Men’s Wear, Kids, and Home.",
  icons: {
    icon: "/images/logo.png",
  },
  openGraph: {
    title: "BSCFASHION",
    description: "B.S. Channabasappa & Sons — Trusted since 1938.",
    url: "https://www.bscfashion.in",
    siteName: "BSCFASHION",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 800,
        alt: "BSCFASHION Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
     
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
      >
        {/* ✅ ALL CLIENT CONTEXTS GO INSIDE Providers */}
      
        <Providers>
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="afterInteractive"
          />

          <main className="min-h-screen">
            {children}
            <PolicyFooter />
          </main>
        </Providers>
       <DesktopFooter/>
      </body>
    </html>

  );
}
