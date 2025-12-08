"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { categories, SubCategory } from "@/data/categories";
import { Product } from "@/types/product";
import { useInfiniteProducts } from "@/hook/useInfiniteProducts";

// Fetch products for main + sub1 + sub2
async function fetchProducts(mainSlug: string, sub1Slug: string, sub2Slug: string): Promise<Product[]> {
  try {
    const res = await fetch(`/api/products?main=${mainSlug}&sub1=${sub1Slug}&sub2=${sub2Slug}`);
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export default function Sub2Page() {
  const { main, sub1, sub2 } = useParams();
  const mainSlug = Array.isArray(main) ? main[0] : main;
  const sub1Slug = Array.isArray(sub1) ? sub1[0] : sub1;
  const sub2Slug = Array.isArray(sub2) ? sub2[0] : sub2;

  const mainCat: SubCategory | undefined = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === mainSlug
  );
  const sub1Cat: SubCategory | undefined = mainCat?.subCategories.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, "-") === sub1Slug
  );
  const sub2Cat: SubCategory | undefined = sub1Cat?.subCategories.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, "-") === sub2Slug
  );

  const mainName = mainCat?.name ?? mainSlug;
  const sub1Name = sub1Cat?.name ?? sub1Slug;
  const sub2Name = sub2Cat?.name ?? sub2Slug;

  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mainSlug || !sub1Slug || !sub2Slug) return;
    setLoading(true);
    fetchProducts(mainSlug, sub1Slug, sub2Slug)
     
      .finally(() => setLoading(false));
  }, [mainSlug, sub1Slug, sub2Slug]);

  if (!mainSlug || !sub1Slug || !sub2Slug) {
    return <div className="p-8 text-center text-red-600">Category not found</div>;
  }
   const { products } = useInfiniteProducts(
    `sub2-${mainSlug}-${sub1Slug}-${sub2Slug}`,
    `/api/products?main=${mainSlug}&sub1=${sub1Slug}&sub2=${sub2Slug}`
  );

  return (
   <div className="min-h-screen bg-white pt-10 pb-20 px-0">
    <Header />
         (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-0.5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )

      
      <Footer />
    </div>
  );
}
