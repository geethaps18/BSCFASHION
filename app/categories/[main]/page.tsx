"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

import { categories, SubCategory } from "@/data/categories";
import ProductCard from "@/components/ProductCard";

import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function MainCategoryPage() {
  const { main } = useParams();
  const mainSlug = Array.isArray(main) ? main[0] : main;

  // 🔥 Hook MUST always be at the top — before ANY return
  const key = `main-${mainSlug || "none"}`;
  const apiUrl = `/api/products?main=${mainSlug || ""}`;
  const { products } = useInfiniteProducts(key, apiUrl);

  // Now safe to check conditions
  if (!mainSlug) {
    return (
      <div className="p-8 text-center text-red-600">
        Category not found
      </div>
    );
  }

  const mainCat: SubCategory | undefined = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === mainSlug
  );

  return (
    <div className="min-h-screen bg-white pt-16 pb- px-0.5">

      {/* Subcategories */}
      {mainCat?.subCategories.length ? (
        <div className="grid grid-cols-2 gap-[2px] sm:grid-cols-3 md:grid-cols-4 sm:gap-4 px-1 mb-2">
          {mainCat.subCategories.map((sub) => {
            const subSlug = sub.name.toLowerCase().replace(/\s+/g, "-");

            return (
              <Link
                key={sub.name}
                href={`/categories/${mainSlug}/${subSlug}`}
                className="relative group rounded-lg overflow-hidden shadow hover:shadow-lg transition-all"
              >
                <Image
                  src={sub.image}
                  alt={sub.name}
                  width={400}
                  height={300}
                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                />

                <div className="absolute bottom-0 w-full bg-black/35 text-white text-center py-20 text-sm font-semibold">
                  {sub.name}
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      {/* Products */}
      <main className="flex-grow sm:p-6 pb-2">
        {products.length === 0 ? (
          <div className="text-gray-500 mt-4 text-center">
            No products available in this category.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[2px] sm:grid-cols-4 lg:grid-cols-6 sm:gap-3 px-0.5">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Header />
      <Footer />
    </div>
  );
}
