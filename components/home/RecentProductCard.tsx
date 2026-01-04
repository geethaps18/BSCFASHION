"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RecentProductCard({ product }: { product: any }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className="cursor-pointer bg-white"
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden">
        <Image
          src={product.images?.[0]}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Text */}
      <div className="pt-2">
        <p className="text-sm font-medium text-gray-900 truncate">
          {product.name}
        </p>
        <p className="text-sm text-gray-600">
          ₹{product.price}
        </p>
      </div>
    </div>
  );
}
