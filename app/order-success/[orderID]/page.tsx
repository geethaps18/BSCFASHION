"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCart } from "@/app/context/BagContext";
import Confetti from "react-confetti";
import Link from "next/link";

export default function OrderSuccessPage() {
  const params = useParams<{ orderId?: string }>();
  const { clearCart } = useCart();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const orderId = params?.orderId;

  useEffect(() => {
    // ✅ Clear cart only once after order
    clearCart();

    // ✅ Prevent back navigation completely
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    // ✅ Set initial confetti dimensions
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      <Confetti
        width={dimensions.width}
        height={dimensions.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
        colors={["#FACC15", "#F59E0B", "#D97706", "#B45309", "#78350F"]}
      />

      <div className="text-center max-w-md w-full z-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
          🎉 Congratulations!
        </h1>

        <p className="text-lg mb-6 text-gray-700">
          Your order{" "}
          <span className="font-semibold text-gray-900">{orderId}</span> has
          been placed successfully.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            prefetch={false}
            className="flex-1 text-center bg-yellow-500 text-black font-semibold py-3 rounded-lg hover:bg-yellow-600 transition"
          >
            Continue Shopping
          </Link>

          <Link
            href="/orders"
            prefetch={false}
            className="flex-1 text-center bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
