"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/BagContext";
import Link from "next/link";
import { ProductCardProduct } from "@/types/product-card";

import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";


interface ProductCardProps {
  product: ProductCardProduct;
  wishlist?: boolean;
  onWishlistToggle?: () => void;
}


export default function ProductCard({
  product,
  wishlist: wishlistProp,
  onWishlistToggle,
}: ProductCardProps) {
  const { wishlist: wishlistContext, toggleWishlist } = useWishlist();
  const { setBagItems } = useCart();
  const router = useRouter();

  const [hovered, setHovered] = useState(false);
  const [rating, setRating] = useState(product.rating ?? 0);
  const [reviewCount, setReviewCount] = useState(product.reviewCount ?? 0);

  // ⭐ Fetch latest ratings
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/rating`);
        if (!res.ok) return;
        const data = await res.json();
        setRating(data.rating ?? 0);
        setReviewCount(data.reviewCount ?? 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRating();
  }, [product.id]);

  // ⭐ Pure product images (no variants)
  const images = product.images?.length
    ? product.images
    : ["/placeholder.png"];

  const mainImage = hovered
    ? images[1] ?? images[0]
    : images[0];

  const liked = wishlistProp ?? wishlistContext.some((p) => p.id === product.id);

  // ⭐ Wishlist
  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    const token = getCookie("token");
    if (!token) {
      router.push("/login?redirect=wishlist");
      return;
    }

    if (onWishlistToggle) onWishlistToggle();
    else toggleWishlist(product);
  };
  const displaySize = product.sizes?.length > 0 
  ? product.sizes[0] 
  : "One Size";


  // ⭐ Add to bag (size required)
  const handleSizeClick = async (
    size: string,
    e: React.MouseEvent<HTMLSpanElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch("/api/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, size }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBagItems(data.items);
      toast.success(`${product.name} (${size}) added to bag`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="cursor-pointer w-full p-0.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* IMAGE */}
      <div className="relative w-full aspect-[4/5] bg-white overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />

        {/* ❤️ HEART */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={handleWishlistClick}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 backdrop-blur-md ring-1 ring-gray-300 shadow hover:scale-110 transition-transform"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                liked ? "text-rose-500 fill-rose-500" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {/* ⭐ RATING */}
        {rating > 0 && (
          <div
            className={`absolute bottom-2 left-2 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg flex items-center gap-1 ${
              rating < 3 ? "bg-yellow-500" : "bg-green-600"
            }`}
          >
            <span>★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
        )}

      {/* SIZES */}
<div
  className={`absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-1 p-2 bg-white/80 backdrop-blur-md transition-all duration-300 ${
    hovered ? "opacity-95 translate-y-0" : "opacity-0 translate-y-full"
  }`}
>
  {(product.sizes?.length ?? 0) > 0 ? (
    product.sizes.map((size) => (
      <span
        key={size}
        onClick={(e) => handleSizeClick(size, e)}
        className="text-gray-800 text-xs md:text-sm font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-900 hover:text-white transition cursor-pointer"
      >
        {size}
      </span>
    ))
  ) : (
    // DEFAULT ONE SIZE
    <span
      onClick={(e) => handleSizeClick("One Size", e)}
      className="text-gray-800 text-xs md:text-sm font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-900 hover:text-white transition cursor-pointer"
    >
      One Size
    </span>
  )}
</div>
</div>


      {/* INFO */}
      <div className="p-3">
        <h3 className="line-clamp-1 text-[#111111] text-sm md:text-base font-light tracking-tight">
          {product.name}
        </h3>


        <div className="space-y-1 p-1">
  <p className="text-xs uppercase tracking-wide text-gray-500">
    {product.brandName ?? "BSCFASHION"}
  </p>
</div>


        {/* PRICE */}
        <div className="flex items-center gap-2 mt-2">
          {product.mrp > product.price && (
            <span className="text-gray-500 line-through text-xs md:text-sm font-light">
              ₹{product.mrp.toLocaleString("en-IN")}
            </span>
          )}

          <span className="text-gray-900 text-sm md:text-base font-medium">
            ₹{product.price.toLocaleString("en-IN")}
          </span>

          {product.discount > 0 && (
            <span className="text-[#CDAF5A] text-xs md:text-sm font-semibold">
              {product.discount}% OFF
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
