// components/admin/ProductModal.tsx
"use client";
import React, { useEffect, useState } from "react";

type ProductPayload = {
  id?: string;
  name: string;
  price: number;
  mrp?: number;
  stock?: number;
  category?: string;
  images?: string[];
  description?: string;
};

export default function ProductModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: ProductPayload) => Promise<void> | void;
  initial?: Partial<ProductPayload>;
}) {
  const [form, setForm] = useState<ProductPayload>({
    name: "",
    price: 0,
    mrp: 0,
    stock: 0,
    category: "",
    images: [],
    description: "",
    ...initial,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }));
  }, [initial]);

  if (!open) return null;

  const handleChange = (k: keyof ProductPayload, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{form.id ? "Edit Product" : "Add Product"}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <input
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Category</label>
            <input
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Price (₹)</label>
            <input
              type="number"
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.price as any}
              onChange={(e) => handleChange("price", Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">MRP (₹)</label>
            <input
              type="number"
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.mrp as any}
              onChange={(e) => handleChange("mrp", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Stock</label>
            <input
              type="number"
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.stock as any}
              onChange={(e) => handleChange("stock", Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Images (comma separated URLs)</label>
            <input
              className="w-full border px-3 py-2 rounded mt-1"
              value={(form.images || []).join(",")}
              onChange={(e) => handleChange("images", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Description</label>
            <textarea
              className="w-full border px-3 py-2 rounded mt-1 resize-y"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-yellow-500 text-black font-medium">
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
