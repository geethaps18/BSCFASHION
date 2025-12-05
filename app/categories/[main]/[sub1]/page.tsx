"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { categories, SubCategory } from "@/data/categories";
import { Product } from "@/types/product";
import Header from "@/components/Header";

// Fetch products for a category + subcategory
async function fetchProducts(mainSlug: string, sub1Slug: string): Promise<Product[]> {
  try {
    const res = await fetch(`/api/products?main=${mainSlug}&sub1=${sub1Slug}`);
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default function Sub1Page() {
  const { main, sub1 } = useParams();
  const mainSlug = Array.isArray(main) ? main[0] : main;
  const sub1Slug = Array.isArray(sub1) ? sub1[0] : sub1;

  const mainCat: SubCategory | undefined = categories.find(
    (cat) => cat.name.toLowerCase().replace(/\s+/g, "-") === mainSlug
  );

  const sub1Cat: SubCategory | undefined = mainCat?.subCategories.find(
    (sub) => sub.name.toLowerCase().replace(/\s+/g, "-") === sub1Slug
  );

  const mainName = mainCat?.name ?? mainSlug;
  const sub1Name = sub1Cat?.name ?? sub1Slug;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mainSlug || !sub1Slug) return;
    setLoading(true);

    fetchProducts(mainSlug, sub1Slug)
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, [mainSlug, sub1Slug]);

  if (!mainSlug || !sub1Slug) {
    return (
      <div className="p-8 text-center text-red-600">
        Category not found
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-white pt-16 pb-20 px-0.5 gap-0">


    {/* Sub-subcategories */}
    {sub1Cat?.subCategories.length ? (
      <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5 px-0">
        {sub1Cat.subCategories.map((sub2) => {
          const sub2Slug = sub2.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <Link
              key={sub2.name}
              href={`/categories/${mainSlug}/${sub1Slug}/${sub2Slug}`}
              className="relative group block w-full h-40 sm:h-48 md:h-56 rounded-lg overflow-hidden"
            >
              <Image
                src={sub2.image}
                alt={sub2.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm sm:text-base font-medium drop-shadow-md">
                  {sub2.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    ) : null}

    {/* Products */}
    <main className="flex-grow p-0 pb-24">
      {loading ? (
        <p className="text-center text-gray-500 py-16">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-center">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-[2px] w-full px-0.5">
          {products.map((product) => (
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
