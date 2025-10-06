"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { categories, SubCategory } from "@/data/categories";
import ProductCard from "@/components/ProductCard";
import { Product as ProductType } from "@/types/product";

// Fetch products for main category
async function fetchProducts(mainSlug: string): Promise<ProductType[]> {
  try {
    const res = await fetch(`/api/products?main=${mainSlug}`);
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export default function MainCategoryPage() {
  const { main } = useParams();
  const mainSlug = Array.isArray(main) ? main[0] : main;

  const mainCat: SubCategory | undefined = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === mainSlug
  );

  const mainName = mainCat?.name ?? mainSlug;

  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mainSlug) return;
    setLoading(true);

    fetchProducts(mainSlug)
      .then((data) => {
        const mappedProducts: ProductType[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          mrp: p.mrp ?? p.price,
          discount: p.discount ?? 0,
          images: p.images?.length ? p.images : ["/placeholder.png"],
          colors: p.colors ?? [],
          sizes: p.sizes ?? ["Free"],
          createdAt: p.createdAt ?? new Date().toISOString(),
          reviewCount: p.reviewCount ?? 0,
          rating: p.rating ?? 0,
          variants: p.variants ?? [],
        }));
        setProducts(mappedProducts);
      })
      .finally(() => setLoading(false));
  }, [mainSlug]);

  if (!mainSlug) {
    return (
      <div className="p-8 text-center text-red-600">
        Category not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16 pb-20 px-6 sm:px-10">
     

      {/* Subcategories */}
      {mainCat?.subCategories.length ? (
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
      {loading ? (
        <div className="text-center py-16 text-gray-600">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-gray-500 mt-4 text-center">
          No products available in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Header />
      <Footer />
    </div>
  );
}
