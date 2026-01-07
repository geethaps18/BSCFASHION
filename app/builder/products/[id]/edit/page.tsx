"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AddProductFormTabbed from "@/components/AddProductForm";

export default function BuilderEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const res = await fetch(`/api/builder/products/${id}`);
      const data = await res.json();
      setProduct(data);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  return (
    <AddProductFormTabbed
      mode="edit"
      initialData={product}
    />
  );
}
