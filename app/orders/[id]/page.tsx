"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Header from "@/components/Header";
import { Truck, Home, X } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  quantity: number;
  size?: string;
  rating?: number;
  reviewCount?: number;
}

interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  items: Product[];
  totalAmount: number;
  address?: Address;
}

const STATUS_TEXT: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
  SHIPPED: { text: "Shipped", color: "bg-blue-100 text-blue-800" },
  OUT_FOR_DELIVERY: { text: "Out for Delivery", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { text: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { text: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKnowMore, setShowKnowMore] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id;

  // Live fetch admin orders
  const { data: adminOrders } = useSWR<Order[]>("/api/admin/order", fetcher, {
    refreshInterval: 5000,
  });

  // Fetch order by ID
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        if (data.order) setOrder(data.order);
        else toast.error("Order not found");
      } catch (err) {
        console.error(err);
        toast.error("Error fetching order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Update order status live from admin
  useEffect(() => {
    if (order && adminOrders) {
      const adminOrder = adminOrders.find((o) => o.id === order.id);
      if (adminOrder && adminOrder.status !== order.status) {
        setOrder({ ...order, status: adminOrder.status });
      }
    }
  }, [adminOrders, order]);

  if (!orderId)
    return <div className="p-6 text-center text-gray-500">Invalid order ID</div>;
  if (loading)
    return <div className="p-6 text-center">Loading order details...</div>;
  if (!order)
    return <div className="p-6 text-center text-gray-500">Order not found</div>;

  const steps = ["Order Placed", "Shipped", "Out for Delivery", "Delivered"];
  const currentStepIndex = steps.findIndex(
    (s) => s === STATUS_TEXT[order.status]?.text
  );

  const calculateEstimatedDelivery = () => {
    const createdDate = new Date(order.createdAt);
    let estimatedDate = new Date(createdDate);
    switch (order.status) {
      case "PENDING":
        estimatedDate.setDate(createdDate.getDate() + 3);
        break;
      case "SHIPPED":
        estimatedDate.setDate(createdDate.getDate() + 5);
        break;
      case "OUT_FOR_DELIVERY":
        estimatedDate.setDate(createdDate.getDate() + 1);
        break;
      case "DELIVERED":
        estimatedDate = createdDate;
        break;
      default:
        estimatedDate = createdDate;
    }
    return estimatedDate.toLocaleDateString();
  };

  const handleRating = async (productId: string, rating: number) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating }),
      });
      if (!res.ok) throw new Error("Failed to rate product");

      // Update rating locally
      setOrder((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((item) =>
          item.id === productId ? { ...item, rating } : item
        );
        return { ...prev, items: newItems };
      });

      toast.success("Rating submitted!");
    } catch (err) {
      toast.error("Failed to submit rating");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Toaster />
      <main className="flex-1 max-w-3xl w-full mx-auto pt-[80px] pb-[140px] px-4 space-y-6">
        {/* Order Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500">Order ID: {order.id}</div>
            <div
              className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-medium ${
                STATUS_TEXT[order.status]?.color || "bg-gray-100 text-gray-800"
              }`}
            >
              {STATUS_TEXT[order.status]?.text || order.status}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex justify-between items-center text-center mb-4 relative">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            return (
              <div key={idx} className="flex flex-col items-center w-1/4 relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {idx === 1 ? <Truck size={16} /> : idx === 3 ? <Home size={16} /> : "✓"}
                </div>
                {idx !== steps.length - 1 && (
                  <div
                    className={`absolute top-3 left-1/2 w-full h-[2px] -z-10 ${
                      idx < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
                <span className="text-xs mt-1">{step}</span>
              </div>
            );
          })}
        </div>

        {/* Estimated Delivery */}
        <div className="bg-white p-4 border border-gray-200 rounded">
          <div className="text-sm text-gray-700">
            Estimated Delivery: {calculateEstimatedDelivery()}
          </div>
        </div>

        {/* Products */}
        <div className="flex flex-col gap-4">
          {order.items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg flex items-start gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-shrink-0 w-32 flex justify-center items-center">
                <Image
                  src={item.images?.[0] || "/placeholder.png"}
                  alt={item.name}
                  width={120}
                  height={120}
                  className="rounded border bg-gray-50"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">{item.name}</h2>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                  <div className="text-xs text-gray-400 mt-2 flex gap-4">
                    {item.size && <span>Size: {item.size}</span>}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-700 mt-2">₹{item.price * item.quantity}</div>

                {/* Rating after delivery */}
                {order.status === "DELIVERED" && (
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(item.id, star)}
                        className={`text-2xl ${star <= (item.rating ?? 0) ? "text-yellow-500" : "text-gray-300"}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-gray-700 text-sm">
                      {item.rating ? item.rating.toFixed(1) : "New"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Address */}
        {order.address ? (
          <div className="bg-white p-4 border border-gray-200 rounded">
            <h3 className="font-semibold mb-2">Delivery Address</h3>
            <p>{order.address.name}</p>
            <p>{order.address.street}, {order.address.city}, {order.address.state}, {order.address.zip}</p>
            <p>Phone: {order.address.phone}</p>
            <p className="text-xs text-gray-400 mt-2">
              Address change unavailable!{" "}
              <span className="text-purple-600 cursor-pointer" onClick={() => setShowKnowMore(true)}>Know More</span>
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 border border-gray-200 rounded text-gray-400">No delivery address available</div>
        )}

        {/* Price Summary */}
        <div className="bg-white p-4 border border-gray-200 rounded">
          <div className="flex justify-between text-gray-700 mb-2">
            <span>Total Amount</span>
            <span className="font-medium">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Cancel button if not delivered/cancelled */}
        {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
          <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-200 max-w-3xl mx-auto">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-2 border border-red-600 text-red-600 rounded"
            >
              Cancel Order
            </button>
          </div>
        )}

        {/* Know More Modal */}
        {showKnowMore && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-80 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowKnowMore(false)}>
                <X size={18} />
              </button>
              <h2 className="text-lg font-semibold mb-3">Why address change unavailable?</h2>
              <p className="text-sm text-gray-600">
                For security and smooth delivery, we don’t allow address changes once an order is placed. You can cancel this order and place a new one with the correct address if needed.
              </p>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-80 relative shadow-lg">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowCancelConfirm(false)}>
                <X size={18} />
              </button>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cancel Order</h2>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2 rounded border border-gray-300 text-gray-600">No, Go Back</button>
                <button onClick={async () => {
                  try {
                    const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
                    if (!res.ok) throw new Error("Failed to cancel");
                    toast.success("Order cancelled successfully");
                    setShowCancelConfirm(false);
                  } catch (err) {
                    toast.error("Could not cancel order");
                  }
                }} className="flex-1 py-2 bg-red-600 text-white rounded">Yes, Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
