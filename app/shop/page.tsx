"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function Shop() {
  // 🔥 Infinite scroll for all products
  const { products } = useInfiniteProducts(
    "shop",                  // unique key for this page
    "/api/products?shop=true" // API route
  );

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="pt-16 sm:pt-20 md:pt-24">
        
        {/* Products Grid */}
        <main className="flex-grow p-1 sm:p-6 pb-24">
          {products.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-0.5 sm:gap-2">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Header />
      <Footer />
    </div>
  );
}
