"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, Bell } from "lucide-react";
import Link from "next/link";
import { useSite } from "@/components/SiteContext";


export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/products?page=${page}&limit=20&search=${search}`
    );
    const data = await res.json();

    setProducts(data.products);
    setTotalPages(data.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to delete");
      return;
    }

    alert("Product deleted successfully!");
    fetchProducts();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Products</h1>

        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md mb-6">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search products..."
          className="border pl-10 pr-3 py-2 rounded-lg w-full"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto bg-white shadow rounded-xl border">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-left border-b">
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Reminders</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={p.images?.[0] || "/placeholder.png"}
                      className="w-12 h-12 rounded border object-cover"
                    />
                    <span className="font-medium">{p.name}</span>
                  </td>

                  <td className="p-4">{p.category || "—"}</td>
                  <td className="p-4 font-semibold">₹{p.price}</td>
                  <td className="p-4">{p.stock}</td>

                  <td className="p-4">
  {p.reminderCount > 0 ? (
    <span className="flex items-center gap-1 text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full w-fit">
      <Bell size={14} />
      {p.reminderCount}
    </span>
  ) : (
    <span className="text-xs text-gray-400">—</span>
  )}
</td>


                  <td className="p-4">
                    {p.stock > 0 ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        In Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        Out of Stock
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right flex justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="p-2 bg-blue-100 text-blue-700 rounded"
                    >
                      <Pencil size={18} />
                    </Link>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 bg-red-100 text-red-700 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <div className="text-gray-700">
          Page {page} of {totalPages}
        </div>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
