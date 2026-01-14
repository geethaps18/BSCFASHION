"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/data/categories";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

export default function Sub2Page() {
  const { main, sub1, sub2 } = useParams();

  const mainSlug = Array.isArray(main) ? main[0] : main;
  const sub1Slug = Array.isArray(sub1) ? sub1[0] : sub1;
  const sub2Slug = Array.isArray(sub2) ? sub2[0] : sub2;

  // ✅ DEFINE KEY (THIS WAS MISSING)
  const key = `sub2-${mainSlug}-${sub1Slug}-${sub2Slug}`;

  // ✅ CORRECT API URL (NO NEWLINES)
  const apiURL =
    `/api/products?category=${encodeURIComponent(mainSlug!)}` +
    `&subCategory=${encodeURIComponent(sub1Slug!)}` +
    `&subSubCategory=${encodeURIComponent(sub2Slug!)}`;

  // 🔥 HOOK AFTER key + apiURL
  const { products } = useInfiniteProducts(key, apiURL);

  if (!mainSlug || !sub1Slug || !sub2Slug) {
    return <div className="p-8 text-center text-red-600">Category not found</div>;
  }

  const mainCat = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === mainSlug
  );

  const sub1Cat = mainCat?.subCategories.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, "-") === sub1Slug
  );

  const sub2Cat = sub1Cat?.subCategories.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, "-") === sub2Slug
  );

  return (
    <div className="min-h-screen bg-white pt-[80px] px-0.5">
      <Header />

      {/* Desktop breadcrumb */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-4">
        <div className="text-sm text-gray-500 mb-1">
          <Link href="/">Home</Link>
          {mainCat && <> / {mainCat.name}</>}
          {sub1Cat && <> / {sub1Cat.name}</>}
          {sub2Cat && <> / <span className="text-gray-900">{sub2Cat.name}</span></>}
        </div>

        <h1 className="text-lg font-semibold text-gray-900">
          {sub2Cat?.name}
          <span className="font-normal text-gray-500">
            {" "}– {products.length} items
          </span>
        </h1>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-0.5 gap-y-6">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <Footer />
    </div>
  );
}
