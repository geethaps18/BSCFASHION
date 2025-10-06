"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Footer from "@/components/Footer";

type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED";

interface Product {
  id: string;
  name: string;
  images?: string[];
  price: number;
}

interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  size?: string | null;
}

interface Order {
  id: string;
  user?: { name?: string; email?: string };
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMode: string;
}

// Status mapping for UI
const STATUS_TEXT: Record<OrderStatus, { text: string; color: string }> = {
  PENDING: { text: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { text: "Confirmed", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { text: "Shipped", color: "bg-blue-300 text-white" },
  OUT_FOR_DELIVERY: { text: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { text: "Delivered", color: "bg-green-100 text-green-800" },
};

// Full status stages
const statusStages: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function AdminOrdersPage() {
  const { data: orders, mutate } = useSWR<Order[]>("/api/admin/order", fetcher);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setLoadingId(orderId);

      const res = await fetch("/api/admin/order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const updated = await res.json();

      if (res.ok) {
        // Update SWR cache
        mutate((prev: Order[] | undefined) => {
          if (!prev) return [updated.order];
          return prev.map(o => (o.id === orderId ? updated.order : o));
        }, false);
      } else {
        console.error("Failed to update order:", updated.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  if (!orders) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Order Management</h1>

      {orders.map(order => {
        const currentIndex = statusStages.indexOf(order.status);

        return (
          <div key={order.id} className="border p-4 mb-6 rounded shadow">
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>User:</strong> {order.user?.name ?? "Unknown"} ({order.user?.email ?? "-"})</p>

            {/* Timeline */}
            <div className="flex items-center my-4">
              {statusStages.map((stage, idx) => {
                const isCompleted = idx <= currentIndex;
                return (
                  <div key={stage} className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center 
                        ${isCompleted ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-gray-500"}`}
                    >
                      {isCompleted ? "✔" : idx + 1}
                    </div>
                    {idx < statusStages.length - 1 && (
                      <div className={`flex-1 h-1 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`}></div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mb-2"><strong>Status:</strong> {STATUS_TEXT[order.status].text}</p>

            {currentIndex < statusStages.length - 1 && (
              <button
                onClick={() => updateStatus(order.id, statusStages[currentIndex + 1])}
                className={`bg-blue-500 text-white px-3 py-1 rounded mb-2 ${loadingId === order.id ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={loadingId === order.id}
              >
                {loadingId === order.id ? "Updating..." : `Move to ${STATUS_TEXT[statusStages[currentIndex + 1]].text}`}
              </button>
            )}

            {/* Products */}
            <div>
              <h3 className="font-semibold mt-2">Products:</h3>
              {order.items?.length ? (
                order.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.product.name}{item.size ? ` - ${item.size}` : ""} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No products in this order</p>
              )}
              <p className="mt-2 font-semibold">Total: ₹{order.totalAmount}</p>
            </div>
          </div>
        );
      })}

      <Footer/>
    </div>
  );
}
