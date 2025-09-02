"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import Link from "next/link";
import { useCart } from "@/app/context/BagContext";
import { useWishlist } from "@/app/context/WishlistContext";
import OrderSummary from "@/components/OrderSummary";

interface BagItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    size?: string;
  };
  quantity: number;
}

export default function BagPage() {
  const { user } = useUser();
  const { updateQuantity, removeFromCart } = useCart();
  const { wishlist } = useWishlist();

  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bag items
  const fetchBag = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bag?userId=${user.id}`);
      const data = await res.json();
      setBagItems(data.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bag");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBag();
  }, [user?.id]);

  // Quantity update
  const handleQuantity = (bagId: string, change: number) => {
    setBagItems((prev) => {
      const item = prev.find((i) => i.id === bagId);
      if (!item) return prev;
      const newQuantity = Math.max(1, item.quantity + change);

      updateQuantity(item.product.id, newQuantity);

      fetch("/api/bag", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, bagId, quantity: newQuantity }),
      }).catch(() => toast.error("Failed to update quantity"));

      return prev.map((i) =>
        i.id === bagId ? { ...i, quantity: newQuantity } : i
      );
    });
  };

  // Remove from bag
  const handleRemove = (bagId: string) => {
    const item = bagItems.find((i) => i.id === bagId);
    if (item) removeFromCart(item.product.id);

    setBagItems((prev) => prev.filter((i) => i.id !== bagId));

    fetch("/api/bag", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id, bagId }),
    })
      .then(() => toast.success("Removed from bag"))
      .catch(() => toast.error("Failed to remove"));
  };

  // Move to wishlist
  const handleMoveToWishlist = (bagId: string, productId: string) => {
    removeFromCart(productId);
    setBagItems((prev) => prev.filter((i) => i.id !== bagId));

    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id, productId }),
    })
      .then(() => toast.success("Moved to wishlist"))
      .catch(() => toast.error("Failed to move to wishlist"));
  };

  // --- Price calculations ---
  const subtotal = bagItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 1000 ? 0 : 50;
  const discount = subtotal > 2000 ? 200 : 0;
  const total = subtotal + shipping - discount;
  const totalItems = bagItems.reduce((acc, item) => acc + item.quantity, 0);

  if (loading)
    return <div className="p-6 text-center text-gray-500">Loading...</div>;

  if (!bagItems.length)
    return (
      <div className="p-6 text-center text-gray-500">
        Your bag is empty. Start adding products!
      </div>
    );
    

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Stepper (Sticky just above product cards) */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="flex justify-around py-3 text-sm font-medium">
          <span className="text-blue-600">1. Bag</span>
          <span className="text-gray-400">2. Review</span>
          <span className="text-gray-400">3. Payment</span>
        </div>
      </div>
     

      {/* Main Content */}
      <div className="flex-grow p-4 space-y-4">
        {/* Bag Items */}
        {bagItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between"
          >
            <div className="flex items-start sm:items-center gap-3">
              <img
                src={item.product.images?.[0] || "/placeholder.png"}
                alt={item.product.name}
                className="w-20 h-20 rounded-lg object-cover border"
              />
              <div className="flex-1 flex flex-col justify-between mt-2 sm:mt-0">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.product.name}
                </h3>
                {item.product.size && (
                  <p className="text-xs text-gray-500 mt-1">
                    Size: {item.product.size}
                  </p>
                )}
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  ₹{item.product.price}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleQuantity(item.id, -1)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    -
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantity(item.id, 1)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-end gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => handleMoveToWishlist(item.id, item.product.id)}
                className="text-xs"
              >
                ❤ Move to Wishlist
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-500 text-xs"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
                  {/* ✅ Add from Wishlist (redirects to wishlist page) */}
      {wishlist.length > 0 && (
        <div className="  bg-white  rounded-lg shadow-md  flex justify-between items-center px-4 py-3">
          <p className="text-sm font-medium">{wishlist.length} items in Wishlist</p>
          <Link href="/wishlist">
            <button className=" bg-[#2B2B2B] rounded-lg text-white px-4 py-2  text-sm">
              Add from Wishlist
            </button>
          </Link>
        </div>
      )}
     
        {/* Price Details Card */}
        <div className="bg-white shadow-md p-4 space-y-2 rounded-xl mb-28">
          <h2 className="font-medium text-gray-800">
            Price Details ({totalItems} items)
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
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Order Total</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Sticky Place Order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50 flex justify-between items-center">
        <div className="flex-1 text-center py-4 font-semibold text-lg text-gray-900 border-r">
          ₹{total}
        </div>
       <Link
      href={{
      pathname: "/checkout/address",
      query: { total: total, userId: user?.id },
      }}
    className="flex-1"
      >
    <button className="w-full h-full bg-[#2B2B2B] text-white py-4 hover:bg-[#1A1A1A]">
    <OrderSummary totalAmount={total} />
    </button>
    </Link>

      </div>
    </div>
  );
}
