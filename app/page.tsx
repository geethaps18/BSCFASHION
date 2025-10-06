"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { Product, ProductVariant } from "@/types/product";
import Header from "@/components/Header";

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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();

        if (!Array.isArray(data?.products)) {
          setProducts([]);
          return;
        }

        const normalized: Product[] = data.products.map((p: any) => {
          const basePrice = Number(p.price) || 0;
          const baseMRP =
            Number(p.mrp) > basePrice
              ? Number(p.mrp)
              : basePrice + Math.floor(Math.random() * 200 + 50);
          const baseDiscount =
            Number(p.discount) > 0
              ? Number(p.discount)
              : Math.round(((baseMRP - basePrice) / baseMRP) * 100);

          const variants: ProductVariant[] =
            Array.isArray(p.variants) && p.variants.length > 0
              ? p.variants.map((v: any) => ({
                  sizes: Array.isArray(v.sizes) && v.sizes.length ? v.sizes : ["S", "M", "L"],
                  color: v.color || { name: "Default", hex: "#111827" },
                  price: Number(v.price ?? basePrice),
                  mrp: Number(v.mrp ?? baseMRP),
                  discount: Number(v.discount ?? baseDiscount),
                  images: Array.isArray(v.images) && v.images.length ? v.images : ["/placeholder.png"],
                  stock: Number(v.stock ?? 0),
                  design: v.design || "",
                }))
              : [
                  {
                    sizes: ["Free"],
                    color: { name: p.color || "Default", hex: "#111827" },
                    price: basePrice,
                    mrp: baseMRP,
                    discount: baseDiscount,
                    images: Array.isArray(p.images) && p.images.length ? p.images : ["/placeholder.png"],
                    stock: p.stock ?? 10,
                    design: "",
                  },
                ];

          return {
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            category: p.category ?? "",
            price: basePrice,
            mrp: baseMRP,
            discount: baseDiscount,
            variants,
            images:
              Array.isArray(p.images) && p.images.length
                ? p.images
                : variants[0].images,
            createdAt: p.createdAt ?? new Date().toISOString(),
          };
        });

        setProducts(normalized);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <div className="pt-16 sm:pt-20 md:pt-24">
        {/* Categories Scroll */}
        <div className="overflow-x-auto scrollbar-hide py-3 bg-white shadow-sm">
          <div className="flex gap-3 px-3 sm:gap-4 sm:px-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/categories/${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer transform transition hover:scale-105"
              >
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <Image
                    src={cat.image || "/placeholder.png"}
                    alt={cat.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span
                  className="mt-1 text-[9px] sm:text-[11px] md:text-sm text-gray-600 font-medium text-center truncate max-w-[50px] sm:max-w-[60px] block"
                  title={cat.name}
                >
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className="w-full h-56 sm:h-72 md:h-96 my-4 relative overflow-hidden shadow-lg">
          <Hero />
        </div>
        <Header/>

        {/* Products Grid */}
        <main className="flex-grow p-1 sm:p-6 pb-24">
          {loading ? (
            <p className="text-gray-500 text-center">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500 text-center">No products found.</p>
          ) : (
           <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-0.5 sm:gap-0.5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
