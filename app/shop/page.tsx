"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { Product, ProductVariant } from "@/types/product";
import Header from "@/components/Header";


export default function Shop() {
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
      <Header/>
      <Footer />
    </div>
  );
}
