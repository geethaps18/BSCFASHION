"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { categories, SubCategory } from "@/data/categories";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function Sub2Page() {
  const { main, sub1, sub2 } = useParams();
  const mainSlug = Array.isArray(main) ? main[0] : main;
  const sub1Slug = Array.isArray(sub1) ? sub1[0] : sub1;
  const sub2Slug = Array.isArray(sub2) ? sub2[0] : sub2;

  // 🔥 HOOK FIRST (important)
  const key = `sub2-${mainSlug}-${sub1Slug}-${sub2Slug}`;
  const apiURL = `/api/products?main=${mainSlug}&sub1=${sub1Slug}&sub2=${sub2Slug}`;
  const { products } = useInfiniteProducts(key, apiURL);
  const mainCat = categories.find(
  (c) => c.name.toLowerCase().replace(/\s+/g, "-") === mainSlug
);

const sub1Cat = mainCat?.subCategories.find(
  (s) => s.name.toLowerCase().replace(/\s+/g, "-") === sub1Slug
);

const sub2Cat = sub1Cat?.subCategories.find(
  (s) => s.name.toLowerCase().replace(/\s+/g, "-") === sub2Slug
);


  // Validate path AFTER hook
  if (!mainSlug || !sub1Slug || !sub2Slug) {
    return <div className="p-8 text-center text-red-600">Category not found</div>;
  }

  return (
     <div className="min-h-screen bg-white pt-16 bg-white pt-[80px] px-0.5">
      <Header />
{/* ✅ DESKTOP BREADCRUMB + TITLE (Myntra style) */}
<div className="hidden lg:block max-w-7xl mx-auto px-6 py-4">
  {/* Breadcrumb */}
  <div className="text-sm text-gray-500 mb-1">
    <Link href="/" className="hover:text-gray-700">Home</Link>
    {mainCat && <> / <span>{mainCat.name}</span></>}
    {sub1Cat && <> / <span>{sub1Cat.name}</span></>}
    {sub2Cat && <> / <span className="text-gray-900">{sub2Cat.name}</span></>}
  </div>

  {/* Title + Count (ONE line) */}
  <h1 className="text-lg font-semibold text-gray-900">
    {sub2Cat?.name}{" "}
    <span className="font-normal text-gray-500">
      – {products.length} items
    </span>
  </h1>
</div>


      {/* Product grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-0.5 gap-y-6">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Footer />
    </div>
  );
}
