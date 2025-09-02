"use client";

import React, { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useWishlist } from "@/app/context/WishlistContext";
import Link from "next/link";

// ✅ Type Definitions
export interface ProductVariant {
  id?: string;
  sizes: string[];
  color: { name: string; hex: string };
  price: number;
  mrp?: number;
  discount?: number;
  images: string[];
  stock?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  variants: ProductVariant[];
  createdAt: string;
  images?: string[];
}

// ✅ Component Props
interface ProductCardProps {
  product: Product;
  wishlist?: boolean;
  onWishlistToggle?: () => void;
  onShare?: () => void;
  onRemove?: () => void;
}

export default function ProductCard({
  product,
  wishlist: wishlistProp,
  onWishlistToggle,
  onShare,
  onRemove,
}: ProductCardProps) {
  const { isSignedIn } = useUser();
  const { wishlist: wishlistContext, toggleWishlist } = useWishlist();
  const [hovered, setHovered] = useState(false);

  // Default variant fallback
  const defaultVariant: ProductVariant = product.variants[0] ?? {
    sizes: [],
    color: { name: "Default", hex: "#000000" },
    price: product.price,
    images: [],
  };

  const mainImage = defaultVariant.images[0] ?? "/placeholder.png";
  const hoverImage = defaultVariant.images[1] ?? mainImage;

  const discount =
    defaultVariant.discount ??
    (defaultVariant.mrp && defaultVariant.mrp > defaultVariant.price
      ? Math.round(((defaultVariant.mrp - defaultVariant.price) / defaultVariant.mrp) * 100)
      : 0);

  const liked =
    wishlistProp !== undefined
      ? wishlistProp
      : wishlistContext.some((p) => p.id === product.id);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Please login first!");
      return;
    }

    if (onWishlistToggle) {
      onWishlistToggle();
    } else {
      await toggleWishlist({
        id: product.id,
        name: product.name,
        price: defaultVariant.price,
        createdAt: product.createdAt,
      });

      if (onRemove && liked) onRemove();
    }
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="cursor-pointer w-full sm:w-[160px] md:w-[200px] lg:w-[240px] m-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image */}
      <div className="relative w-full aspect-[4/5] bg-gray-50 overflow-hidden duration-300">
        <img
          src={hovered ? hoverImage : mainImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
        />

        {/* Wishlist & Share Buttons */}
        <div className="absolute top-2 right-2 flex flex-col items-center gap-2 z-20">
          <button
            onClick={handleWishlistClick}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 backdrop-blur-md ring-1 ring-black/10 shadow-md hover:scale-110 transition-transform"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                liked ? "text-rose-500 fill-rose-500" : "text-gray-500"
              }`}
            />
          </button>

          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onShare();
              }}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:scale-110 transition-transform bg-white/90 shadow-md"
            >
              <Share2 className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-2 md:p-3">
        <h3 className="text-sm md:text-base font-medium text-gray-900 line-clamp-1">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-600 text-xs md:text-sm mt-1 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          {defaultVariant.mrp && defaultVariant.mrp > defaultVariant.price && (
            <span className="text-gray-400 line-through text-xs md:text-sm">
              ₹{defaultVariant.mrp.toLocaleString("en-IN")}
            </span>
          )}
          <span className="font-semibold text-emerald-700 text-sm md:text-base">
            ₹{defaultVariant.price.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <span className="text-red-500 text-xs md:text-sm">({discount}% OFF)</span>
          )}
        </div>

        {/* Colors */}
        <div className="flex gap-1 mt-1">
          {product.variants.map((v, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: v.color.hex }}
              title={v.color.name}
            />
          ))}
        </div>

        {/* Sizes */}
        <div className="flex gap-1 mt-1 text-xs text-gray-600">
          {defaultVariant.sizes.map((s) => (
            <span key={s} className="border px-1 rounded">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}


