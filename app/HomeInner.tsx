"use client";

import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LoadingRing from "@/components/LoadingRing";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

// ✅ EXISTING recent products slider component
import RecentProductsSlider from "@/components/home/RecentProductsSlider";

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

  const initialLoading = products.length === 0;

  // ✅ Take only first 10 for slider
  const recentProducts = products.slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
    <div className="pt-[72px] lg:pt-[96px]">

        {/* Header */}
        <Header />

        {/* Categories Scroll (Mobile) */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide py-1 bg-white shadow-md w-full">
          <div className="flex gap-3 px-3 sm:gap-4 sm:px-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/categories/${cat.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className="flex-shrink-0 flex flex-col items-center hover:scale-105 transition"
              >
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 overflow-hidden rounded-xl">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="mt-1 text-[10px] sm:text-[12px] md:text-sm text-gray-700 font-medium text-center truncate max-w-[70px]">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

       <div className="-mt- lg:-mt-10">
  <Hero />
</div>


        {/* ✅ Recent Products Slider */}
        {!initialLoading && recentProducts.length > 4 && (
          <RecentProductsSlider products={recentProducts} />
        )}

        {/* Products Grid */}
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

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t shadow-lg">
        <Footer />
      </div>
    </div>
  );
}
