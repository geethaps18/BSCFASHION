"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/app/context/BagContext";
import { useWishlist } from "@/app/context/WishlistContext";
import CheckoutStepper from "@/components/CheckoutStepper";

export default function BagPage() {
  const {
    bagItems,
    totalCount,
    subtotal,
    shipping,
    total,
    updateQuantity,
    removeFromCart,
    updateSize,
  } = useCart();

  const { wishlist, toggleWishlist } = useWishlist();

  // --- Discount logic (can move into context if global) ---
  const discount = subtotal > 2000 ? 200 : 0;
  const finalTotal = total - discount;

  // --- Handlers ---
  const handleQuantity = (uniqueKey: string, change: number) => {
    const item = bagItems.find((i) => i.uniqueKey === uniqueKey);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + change);
    updateQuantity(uniqueKey, newQty);
  };

  const handleSizeChange = (uniqueKey: string, size: string) => {
    if (!size) return;
    updateSize(uniqueKey, size);
  };

  const handleRemove = (uniqueKey: string) => removeFromCart(uniqueKey);

  const handleMoveToWishlist = (uniqueKey: string) => {
    const item = bagItems.find((i) => i.uniqueKey === uniqueKey);
    if (!item) return;
    handleRemove(uniqueKey);
    toggleWishlist(item.product);
  };

  // --- Empty Bag ---
  if (!bagItems.length)
    return (
   <div className="flex flex-col min-h-screen bg-gray-50 pt-0">
      {/* Stepper */}
      <CheckoutStepper />
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-4">
        <img
          src="/images/empty-bag.png"
          alt="Empty bag"
          className="w-70 mb-6"
        />
        <h2 className="text-2xl font-bold mb-2">Your bag is empty 😅</h2>
        <Link
          href="/"
          className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
        >
          Start Shopping 🛍️
        </Link>
      </div>
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-0">
      {/* Stepper */}
      <CheckoutStepper />

      {/* Bag Items and Sidebar */}
      <div className="flex flex-col lg:flex-row lg:p-10 lg:space-x-4 lg:pb-0 pb-32">
        {/* Items List */}
        <div className="grid grid-cols-1 gap-0.5">
          <AnimatePresence>
            {bagItems.map((item) => (
              <motion.div
                key={item.uniqueKey}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
                className="bg-white shadow-md p-4 flex flex-col sm:flex-row sm:items-center justify-between"
              >
                {/* Product Info */}
                <div className="flex items-start sm:items-center gap-5">
                 <Link
  href={`/product/${item.product.id}`}
  className="block w-30 h-30 flex-shrink-0  overflow-hidden border"
>
  <img
    src={item.product.images?.[0] || "/placeholder.png"}
    alt={item.product.name}
    className="w-full h-full object-cover"
  />
</Link>


                  <div className="flex-1 flex flex-col justify-between mt-2 sm:mt-0">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2">
                      {item.product.name} {item.size && `(${item.size})`}
                    </h3>

                    {item.product.availableSizes?.length ? (
  <div className="mt-1">
    <label className="text-xs text-gray-500">Size:</label>
    <select
      value={item.size || ""}
      onChange={(e) => handleSizeChange(item.uniqueKey, e.target.value)}
      className="ml-2 border text-sm px-2 py-1 rounded-lg"
    >
      <option value="">Select Size</option>
      {item.product.availableSizes?.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  </div>
) : null}


                    <p className="text-sm sm:text-base font-semibold text-gray-800 mt-1">
                      ₹{item.product.price * item.quantity}
                    </p>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQuantity(item.uniqueKey, -1)}
                        className="px-2 py-1 border rounded-lg hover:bg-gray-100 transition"
                      >
                        -
                      </button>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                        }}
                        className="text-sm font-medium"
                      >
                        {item.quantity}
                      </motion.span>
                      <button
                        onClick={() => handleQuantity(item.uniqueKey, 1)}
                        className="px-2 py-1 border rounded-lg hover:bg-gray-100 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col items-end gap-2 mt-2 mx-2 sm:mt-0">
                  <motion.button
                    onClick={() => handleMoveToWishlist(item.uniqueKey)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-xs sm:text-sm text-gray-600 hover:text-yellow-600 font-medium"
                  >
                    ❤ Move to Wishlist
                  </motion.button>
                  <motion.button
                    onClick={() => handleRemove(item.uniqueKey)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-xs sm:text-sm text-red-500 font-medium"
                  >
                    Remove
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Sidebar: Wishlist + Price Details + Desktop Button */}
        <div className="mt-4 lg:mt-0 lg:w-1/3 flex flex-col gap-4 lg:sticky lg:px-10 lg:top-20">
          {wishlist.length > 0 && (
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
              <p className="text-sm font-medium">
                {wishlist.length} items in Wishlist
              </p>
              <Link href="/wishlist">
                <button className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 px-4 py-2 font-semibold rounded-xl transition transform hover:-translate-y-0.5">
                  Add from Wishlist
                </button>
              </Link>
            </div>
          )}

          {/* Price Details */}
          <div className="bg-white shadow-md p-8 space-y-3">
            <h2 className="font-medium text-gray-800">
              Price Details ({totalCount} items)
            </h2>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Total Product Price</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Shipping</span>
              <span>₹{shipping}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Total Discounts</span>
              <span>- ₹{discount}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold text-gray-900 text-lg">
              <span>Order Total</span>
              <span>₹{finalTotal}</span>
            </div>

            {/* Desktop Button */}
            <div className="hidden lg:block mt-4">
              <Link
                href={{
                  pathname: "/checkout/address",
                  query: { subtotal, shipping, discount, total: finalTotal, totalCount },
                }}
              >
                <button className="w-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-3 hover:shadow-lg transition">
                  Continue
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50 flex lg:hidden">
        <div className="flex-1 text-center py-4 font-semibold text-lg text-gray-900 border-r">
          ₹{finalTotal}
        </div>
        <Link
          href={{
            pathname: "/checkout/address",
            query: { subtotal, shipping, discount, total: finalTotal, totalCount },
          }}
          className="flex-1"
        >
          <button className="w-full h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-gray-900 font-semibold py-4 shadow-lg hover:shadow-xl transition">
            Continue
          </button>
        </Link>
      </div>
    </div>
  );
}
