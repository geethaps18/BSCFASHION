"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") || "N/A";

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">🎉 Congratulations!</h1>
        <p className="text-gray-700 mb-2">Your order has been successfully placed.</p>
        <p className="text-gray-500 mb-4">Order ID: <span className="font-medium">{orderId}</span></p>
        <Link href="/">
          <button className="mt-2 bg-[#2B2B2B] text-white py-3 px-6 rounded hover:bg-[#1A1A1A]">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
}
