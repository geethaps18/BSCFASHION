"use client";

import { useInfiniteProducts } from "@/hook/useInfiniteProducts";
import ProductCard from "@/components/ProductCard";

type ProductsSectionProps = {
  siteId: string;
};

export default function ProductsSection({ siteId }: ProductsSectionProps) {
  const { products } = useInfiniteProducts(
    `site-${siteId}`,
    `/api/site-products?siteId=${siteId}`
  );

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
