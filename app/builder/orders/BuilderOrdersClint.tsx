"use client";

import React, { useEffect, useState } from "react";
import { Package } from "lucide-react";
import toast from "react-hot-toast";
import { useSite } from "@/components/SiteContext";

type SellerOrderItem = {
  id: string;            // orderItem id
  orderId: string;       // parent order id
  status: string;
  paymentMode: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  name: string;
  brandName?: string;
  quantity: number;
  price: number;
  size?: string | null;
  image: string;
  
  confirmedAt?: string | null;
};

export default function BuilderOrdersClient() {
  const { siteId } = useSite();
  const [orders, setOrders] = useState<SellerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const markAsPacked = async (orderItemId: string) => {
  const t = toast.loading("Marking as packed...");

  try {
    const res = await fetch("/api/builder/orders/confirm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderItemId }),
    });

    if (!res.ok) throw new Error("Failed");

    toast.success("Order marked as packed", { id: t });
    fetchOrders(); // 🔁 refresh list
  } catch {
    toast.error("Failed to update order", { id: t });
  }
};


  const fetchOrders = async () => {
    if (!siteId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/builder/orders?siteId=${siteId}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [siteId]);

  if (!siteId) {
    return <div className="p-6 text-gray-600">Please select a website</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="p-6 text-gray-600">No orders yet.</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Orders</h1>

      {orders.map((item) => (
        <div
          key={item.id}
          className="bg-white p-4 rounded-xl shadow border space-y-3"
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">
                Order #{item.orderId.slice(-6)}
              </p>
              <p className="text-xs text-gray-500 uppercase">
                {item.brandName || "BSCFASHION"}
              </p>
            </div>
            <Package className="text-blue-500" size={18} />
          </div>

          {/* Product */}
          <div className="flex items-center gap-3">
            <img
              src={item.image || "/no-image.png"}
              alt={item.name}
              className="w-14 h-14 rounded border object-cover bg-gray-100"
            />
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">
                Qty: {item.quantity} • Size: {item.size || "Free"}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              Customer:{" "}
              <span className="font-medium">
                {item.customer?.name || "Guest"}
              </span>
            </p>
            <p>Payment: {item.paymentMode}</p>
            <p className="font-semibold">₹{item.price}</p>
          </div>

          {/* Status */}
          <div className="text-xs">
      {!item.confirmedAt ? (
  <button
    onClick={() => markAsPacked(item.id)}
    className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white"
  >
    Mark as Packed
  </button>
) : (
  <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
    Packed
  </span>
)}
</div>


        </div>
      ))}
    </div>
  );
}
