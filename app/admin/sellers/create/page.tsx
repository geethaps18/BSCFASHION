"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminCreateSellerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    brandName: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.brandName) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create seller");
      }

      toast.success("Seller & site created successfully");

      // Redirect to sellers list (or dashboard)
      router.push("/admin/sellers");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Create Seller & Website
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Seller Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Seller Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ravi Web"
            className="w-full border rounded-lg px-4 py-2"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number *
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
            className="w-full border rounded-lg px-4 py-2"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="seller@email.com"
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {/* Brand / Site Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Brand / Website Name *
          </label>
          <input
            type="text"
            name="brandName"
            value={form.brandName}
            onChange={handleChange}
            placeholder="Ravi Web Fashion"
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be used to create the seller website
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Seller"}
        </button>
      </form>
    </div>
  );
}
