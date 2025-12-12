// components/admin/ProductTable.tsx
"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Edit, Trash2 } from "lucide-react";

export type SimpleProduct = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  stock?: number;
  category?: string;
  images?: string[];
  createdAt?: string;
};

export default function ProductTable({
  products,
  onEdit,
  onDelete,
}: {
  products: SimpleProduct[];
  onEdit: (p: SimpleProduct) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <input
          placeholder="Search products or category..."
          className="flex-1 border rounded px-3 py-2"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />

        <div className="text-sm text-gray-600">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {slice.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border overflow-hidden shadow-sm">
            <div className="relative h-44 bg-gray-100">
              {p.images && p.images.length > 0 ? (
                // Next/Image requires remote config for external urls — fallback to img tag if necessary
                <img src={p.images[0]} alt={p.name} className="w-full h-44 object-cover" />
              ) : (
                <div className="w-full h-44 flex items-center justify-center text-gray-400">No image</div>
              )}
            </div>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.category || "—"}</div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">₹{p.price}</div>
                  {p.mrp && p.mrp > p.price && (
                    <div className="text-xs line-through text-gray-400">₹{p.mrp}</div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className={`text-xs px-2 py-1 rounded ${p.stock && p.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {p.stock && p.stock > 0 ? `In stock (${p.stock})` : "Out of stock"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>

                  <button
                    onClick={() => onDelete(p.id)}
                    className="p-2 rounded hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page} of {pages}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
