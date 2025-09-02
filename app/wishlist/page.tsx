"use client";

import React from "react";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/app/context/WishlistContext";
import { useUser } from "@clerk/nextjs";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { isSignedIn } = useUser();

  if (!isSignedIn) return <p className="p-4 text-center">Please login to see wishlist.</p>;
  if (wishlist.length === 0) return <p className="p-4 text-center">Your wishlist is empty.</p>;

  return (
    <main className="flex-grow p-4 sm:p-6 pb-24 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 text-center sm:text-left">
        Wishlist
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {wishlist.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            wishlist={true} // heart filled
            onRemove={() => removeFromWishlist(product)} // permanent remove
          />
        ))}
      </div>
    </main>
  );
}
