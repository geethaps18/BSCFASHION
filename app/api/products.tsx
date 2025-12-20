// AddProductForm.tsx
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function AddProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [mrp, setMrp] = useState<number | "">("");        // optional
  const [discount, setDiscount] = useState<number | "">(""); // optional
  const [category, setCategory] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !category) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price.toString());
    if (mrp) formData.append("mrp", mrp.toString());
    if (discount) formData.append("discount", discount.toString());
    formData.append("category", category);
    images.forEach((file) => formData.append("images", file));

    try {
      setLoading(true);
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Reset form
        setName("");
        setDescription("");
        setPrice("");
        setMrp("");
        setDiscount("");
        setCategory("");
        setImages([]);
      } else {
        toast.error(data.message || "Failed to add product");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold">Add New Product</h2>

      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="number"
        placeholder="MRP (optional)"
        value={mrp}
        onChange={(e) => setMrp(Number(e.target.value))}
        className="w-full p-2 border rounded"
      />

      <input
        type="number"
        placeholder="Discount % (optional)"
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
        className="w-full"
      />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <span key={idx} className="text-sm bg-gray-100 p-1 rounded">{img.name}</span>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-700 text-white px-4 py-2 rounded hover:bg-emerald-800 transition"
      >
        {loading ? "Uploading..." : "Add Product"}
      </button>
    </form>
  );
}
