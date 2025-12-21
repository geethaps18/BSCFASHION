"use client";

import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";
import LoadingRing from "@/components/LoadingRing";


const categories = [
  { name: "Men", image: "/images/men.png" },
  { name: "Saree", image: "/images/saree.png" },
  { name: "Ethnic", image: "/images/ethnic.png" },
  { name: "Western", image: "/images/western.png" },
  { name: "Kids", image: "/images/kids.png" },
  { name: "Groom Collections", image: "/images/groom.png" },
  { name: "Bridal Collections", image: "/images/bridal.png" },
  { name: "Couple Wedding Collections", image: "/images/couple.png" },
  { name: "Home", image: "/images/home.png" },
  { name: "Jewellery", image: "/images/jewellery.png" },
];

export default function HomeInner() {
  
  // 🔥 Infinite products (correct place)
  const { products } = useInfiniteProducts("home", "/api/products?home=true");

  // Show ring only when products array is empty
  const initialLoading = products.length === 0;

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      <div className="mt-8">

        {/* Ticker */}
        <div className="lg:hidden mt-6 relative overflow-hidden z-50">

          <div className="bg-gradient-to-r shadow-2xl py-1 px-4 flex items-center">
            <div className="flex animate-marquee whitespace-nowrap text-yellow-900 font-semibold text-l md:text-xl tracking-wider drop-shadow-lg ribbon-text">
              <span className="mx-8">🪔🎇 ದೀಪಾವಳಿ ಡಬಲ್ ಡಿಸ್ಕೌಂಟ್! ತಪ್ಪಿಸಿಕೊಳ್ಳಬೇಡಿ!</span>
              <span className="mx-8">🪔🎇 Double Discount this Deepavali! Don’t miss out!</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 12s linear infinite;
          }
        `}</style>

        {/* Header */}
        <Header />

        {/* Categories Scroll */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide py-1 bg-white shadow-md w-full">

          <div className="flex gap-3 px-3 sm:gap-4 sm:px-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/categories/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-shrink-0 flex flex-col items-center hover:scale-105 transition"
              >
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 overflow-hidden rounded-xl hover:shadow-2xl transition-shadow">
                  <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                </div>
                <span className="mt-1 text-[10px] sm:text-[12px] md:text-sm text-gray-700 font-medium text-center truncate max-w-[60px] sm:max-w-[70px]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className="w-full h-60 sm:h-72 md:h-96 lg:h-[520px] mt-2 relative overflow-hidden">

          <Hero />
        </div>
        
 

        {/* Products */}
        <main className="flex-grow sm:p-6 pb-2">
          {initialLoading ? (
            <div className="flex justify-center py-10">
              <LoadingRing />
            </div>
          ) : (
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-0.5 gap-y-6">
              
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>

      {/* FIXED FOOTER */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t shadow-lg">
        <Footer />
      </div>
    </div>
  );
}
