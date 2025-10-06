"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/BagContext";
import Link from "next/link";
import { Product, ProductVariant } from "@/types/product";

interface ProductCardProps {
  product: Product;
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
  const [hovered, setHovered] = useState(false);

  // Rating state
  const [rating, setRating] = useState(product.rating ?? 0);
  const [reviewCount, setReviewCount] = useState(product.reviewCount ?? 0);

  // Fetch latest ratings from backend
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/rating`);
        if (!res.ok) throw new Error("Failed to fetch rating");
        const data = await res.json();
        setRating(data.rating ?? 0);
        setReviewCount(data.reviewCount ?? 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRating();
  }, [product.id]);

  // Variants
  const variants: ProductVariant[] =
    product.variants?.length
      ? product.variants
      : [
          {
            sizes: ["FREE"],
            price: product.price,
            mrp: product.mrp ?? product.price,
            discount: product.discount ?? 0,
            images: product.images?.length ? product.images : ["/placeholder.png"],
            stock: 10,
            design: "",
            colors: [],
          },
        ];

  const [selectedVariant] = useState<ProductVariant>(variants[0]);
  const mainImage = hovered
    ? selectedVariant.images[1] ?? selectedVariant.images[0]
    : selectedVariant.images[0];

  const discount =
    selectedVariant.discount ??
    (selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price
      ? Math.round(
          ((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100
        )
      : 0);

  const liked = wishlistProp ?? wishlistContext.some((p) => p.id === product.id);

  // Wishlist toggle
  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (onWishlistToggle) onWishlistToggle();
    else toggleWishlist(product);
  };

  // Add product to bag
  const handleSizeClick = async (size: string, e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch("/api/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add to bag");
      setBagItems(data.items);
      toast.success(`${product.name} (${size}) added to bag`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="cursor-pointer w-full sm:w-[160px] md:w-[200px] lg:w-[240px] m-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] bg-white overflow-hidden">
        <img
          src={mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        {/* Heart Button */}
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

        {/* Sizes */}
        {selectedVariant.sizes?.length && (
          <div
            className={`absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-1 p-2 bg-white/80 backdrop-blur-md transition-all duration-300 ${
              hovered ? "opacity-95 translate-y-0" : "opacity-0 translate-y-full"
            }`}
          >
            {selectedVariant.sizes.map((size) => (
              <span
                key={size}
                onClick={(e) => handleSizeClick(size, e)}
                className="text-gray-800 text-xs md:text-sm font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-900 hover:text-white transition cursor-pointer"
              >
                {size}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="line-clamp-1 text-[#111111] text-sm md:text-base font-light tracking-tight">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          {rating > 0 ? (
            <>
              <span
                className="text-yellow-500 text-base font-medium"
                style={{
                  background: "linear-gradient(90deg, #FFD700, #FFC107)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ★
              </span>
              <span className="text-gray-700 text-sm font-light">{rating.toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-gray-400 text-xs">({reviewCount})</span>}
            </>
          ) : (
            <span className="text-gray-400 text-xs font-light">New</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          {selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price && (
            <span className="text-gray-400 line-through text-xs md:text-sm font-light">
              Rs.{selectedVariant.mrp.toLocaleString("en-IN")}
            </span>
          )}
          <span className="text-gray-900 text-sm md:text-base">
            Rs. {selectedVariant.price.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <span className="text-[#CDAF5A] text-xs md:text-sm font-semibold">{discount}% OFF</span>
          )}
        </div>
      </div>
    </Link>
  );
}
