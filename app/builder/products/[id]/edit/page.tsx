"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function BuilderEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Product fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  // 🔹 Fetch product details (BUILDER API)
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/builder/products/${id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to load product");
          return;
        }

        setName(data.name || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setPrice(String(data.price || ""));
        setMrp(String(data.mrp || ""));
        setStock(String(data.stock || ""));
        setSizes(data.sizes || []);
        setImages(data.images || []);
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // Remove image (UI only)
  const removeImage = (img: string) => {
    setImages((prev) => prev.filter((i) => i !== img));
  };

  // 🔹 Submit update (BUILDER API)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("category", category);
    form.append("price", price);
    form.append("mrp", mrp);
    form.append("stock", stock);
    form.append("sizes", JSON.stringify(sizes));
    form.append("oldImages", JSON.stringify(images));

    newImages.forEach((img) => form.append("images", img));

    try {
      const res = await fetch(`/api/builder/products/${id}`, {
        method: "PUT",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update");
        setSaving(false);
        return;
      }

      toast.success("Product updated successfully!");
      router.push("/builder/products");
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-black rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">Edit Product</h1>

      <form onSubmit={handleUpdate} className="space-y-5">
        {/* NAME */}
        <div>
          <label className="font-medium">Product Name</label>
          <input
            className="border p-2 rounded w-full mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="font-medium">Description</label>
          <textarea
            className="border p-2 rounded w-full mt-1"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* CATEGORY */}
        <div>
          <label className="font-medium">Category</label>
          <input
            className="border p-2 rounded w-full mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        {/* PRICE & MRP */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Price</label>
            <input
              type="number"
              className="border p-2 rounded w-full mt-1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="font-medium">MRP</label>
            <input
              type="number"
              className="border p-2 rounded w-full mt-1"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
            />
          </div>
        </div>

        {/* STOCK */}
        <div>
          <label className="font-medium">Stock</label>
          <input
            type="number"
            className="border p-2 rounded w-full mt-1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>

        {/* SIZES */}
        <div>
          <label className="font-medium">Sizes (comma separated)</label>
          <input
            className="border p-2 rounded w-full mt-1"
            value={sizes.join(",")}
            onChange={(e) =>
              setSizes(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>

        {/* EXISTING IMAGES */}
        <div>
          <label className="font-medium">Existing Images</label>
          <div className="grid grid-cols-4 gap-3 mt-2">
            {images.map((img) => (
              <div key={img} className="relative">
                <img
                  src={img}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removeImage(img)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* NEW IMAGES */}
        <div>
          <label className="font-medium">Add New Images</label>
          <input
            type="file"
            multiple
            className="border p-2 rounded w-full mt-1"
            onChange={(e) =>
              setNewImages(Array.from(e.target.files || []))
            }
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
