"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


type Seller = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  blocked: boolean;
  sites: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
    const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/seller")
      .then((res) => res.json())
      .then((data) => setSellers(data.sellers || []))
      .catch(() => toast.error("Failed to load sellers"))
      .finally(() => setLoading(false));
  }, []);

 if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Sellers</h1>

        <Link
          href="/admin/sellers/create"
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm"
        >
          + Create Seller
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Seller</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Website</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr
  key={seller.id}
  onClick={() => router.push(`/admin/sellers/${seller.id}`)}
  className="border-t cursor-pointer hover:bg-gray-50"
>

                <td className="px-4 py-3 font-medium">
                  {seller.name || "—"}
                </td>

                <td className="px-4 py-3">
                  {seller.phone || "—"}
                </td>

                <td className="px-4 py-3">
                  {seller.sites?.[0] ? (
                    <span className="text-blue-600">
                      /store/{seller.sites[0].slug}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-3">
                  {seller.blocked ? (
                    <span className="text-red-600 font-medium">Blocked</span>
                  ) : (
                    <span className="text-green-600 font-medium">Active</span>
                  )}
                </td>
              </tr>
            ))}

            {sellers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No sellers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
