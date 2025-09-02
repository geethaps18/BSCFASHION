"use client";

import Hero from "@/components/Hero";
import ProductCard, { Product, ProductVariant } from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const categories = [
  { name: "Men", image: "/images/men.png" },
  { name: "Saree", image: "/images/saree.png" },
  { name: "Western", image: "/images/western.png" },
  { name: "Kids", image: "/images/kids.png" },
  { name: "Home", image: "/images/home.png" },
  { name: "Toys", image: "/images/toys.png" },
  { name: "Groom", image: "/images/groom.png" },
  { name: "Bride", image: "/images/bridal.png" },
  { name: "Festive Kids", image: "/images/festive-kids.png" },
  { name: "Heritage Sarees", image: "/images/heritage.png" },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();

        const normalized: Product[] = (data?.products || []).map((p: any) => {
          const price = Number(p.price) || 0;
          const mrp = Number(p.mrp) > price ? Number(p.mrp) : price + Math.floor(Math.random() * 200 + 50);
          const discount = Number(p.discount) > 0 ? Number(p.discount) : mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

          // Normalize variants
          const variants: ProductVariant[] = (p.variants?.length
            ? p.variants
            : [{
                sizes: ["S", "M", "L"],
                color: { name: p.color || "Default", hex: "#111827" },
                price,
                mrp,
                discount,
                images: Array.isArray(p.images) && p.images.length ? p.images : ["/placeholder.png"],
                stock: p.stock ?? 10,
              }]
          ).map((v: any) => ({
            sizes: v.sizes || ["S", "M", "L"],
            color: v.color || { name: "Default", hex: "#111827" },
            price: Number(v.price ?? price),
            mrp: Number(v.mrp ?? mrp),
            discount: Number(v.discount ?? discount),
            stock: Number(v.stock ?? 0),
            images: Array.isArray(v.images) && v.images.length ? v.images : ["/placeholder.png"],
            design: v.design || "",
          }));

          // Main images fallback
          const images =
            Array.isArray(p.images) && p.images.length
              ? p.images
              : variants[0].images.length
              ? variants[0].images
              : ["/placeholder.png"];

          return {
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            category: p.category ?? "",
            price,
            variants,
            images,
            createdAt: p.createdAt ?? new Date().toISOString(),
          };
        });

        setProducts(normalized);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Categories */}
      <div className="overflow-x-auto scrollbar-hide py-4 bg-white shadow-sm">
        <div className="flex gap-4 px-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={`/categories/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer transform transition hover:scale-105"
            >
              <div className="relative w-10 h-10 md:w-20 md:h-20 overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <Image src={cat.image || "/placeholder.png"} alt={cat.name} fill className="object-cover" />
              </div>
              <span
                className="mt-1 text-[11px] md:text-sm text-gray-700 font-medium text-center truncate max-w-[120px]"
                title={cat.name}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="w-full h-56 sm:h-72 md:h-96 my-4 relative overflow-hidden shadow-lg">
        <Hero />
      </div>

      {/* Products */}
      <main className="flex-grow p-1 sm:p-6 pb-24">
        {loading ? (
          <p className="text-gray-500 text-center">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-0.5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
