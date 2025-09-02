"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

export default function AddressPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const total = searchParams?.get("total"); // 🔹 get total amount from query
  const userId = searchParams?.get("userId"); // 🔹 get userId from query

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userId) {
      toast.error("You must be logged in");
      return;
    }

    try {
      const res = await fetch("/api/save-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...address, userId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Address saved!");
        // 🔹 pass total amount and userId to payment page
        router.push(`/checkout/payment?total=${total}&userId=${userId}`);
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Toaster position="top-right" />
      <h2 className="text-xl font-bold mb-4">Shipping Address</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="name"
          placeholder="Full Name"
          value={address.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={address.phone}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="street"
          placeholder="Street Address"
          value={address.street}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="city"
          placeholder="City"
          value={address.city}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="state"
          placeholder="State"
          value={address.state}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="pincode"
          placeholder="Pincode"
          value={address.pincode}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-[#2B2B2B] text-white font-medium py-3 rounded hover:bg-[#1A1A1A]"
        >
          Continue to Payment
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Or go directly to{" "}
        <Link
          href={`/checkout/payment?total=${total}&userId=${userId}`}
          className="text-blue-600 hover:underline"
        >
          Continue to Payment
        </Link>
      </p>
    </div>
  );
}
