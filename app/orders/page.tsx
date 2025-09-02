"use client";

import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import Footer from "@/components/Footer";

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[] | null;
}

interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string; // PENDING, SHIPPED, DELIVERED, RETURNED, CANCELLED
  paymentMode: string;
  address: string;
  expectedDelivery?: string;
  trackingNumber?: string;
  createdAt: string;
  items: OrderItem[];
  trackingHistory?: {
    stage: string;
    date: string;
    location?: string;
  }[];
}

const ORDER_STAGES = ["PENDING", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "yellow-400",
  SHIPPED: "blue-400",
  DELIVERED: "green-400",
  RETURNED: "purple-400",
  CANCELLED: "red-400",
};

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders?userId=${user.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) setOrders(data.orders);
      else toast.error(data.error || "Failed to fetch orders");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      toast.error("User not logged in");
      setLoading(false);
      return;
    }
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user, isLoaded]);

  const updateOrderStatus = async (orderId: string, action: "CANCEL" | "RETURN") => {
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o))
        );
        toast.success(`Order ${data.order.status.toLowerCase()} successfully`);
      } else toast.error(data.error || "Failed to update order");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while updating order");
    }
  };

  const renderTrackingTimeline = (order: Order) => {
    const currentIndex = ORDER_STAGES.indexOf(order.status);
    return (
      <div className="flex flex-col items-center ml-4 relative">
        {ORDER_STAGES.map((stage, idx) => {
          const completed = idx <= currentIndex;
          const historyItem = order.trackingHistory?.find((t) => t.stage === stage);

          return (
            <div key={stage} className="flex flex-col items-center relative">
              {/* Circle */}
              <div
                className={`w-5 h-5 rounded-full flex-shrink-0 mb-1 transition-colors duration-500 ${
                  completed ? `bg-${STATUS_COLORS[stage]}` : "bg-gray-300"
                }`}
              ></div>

              {/* Connecting vertical line */}
              {idx !== ORDER_STAGES.length - 1 && (
                <div
                  className={`w-1 h-16 ${
                    idx < currentIndex ? `bg-${STATUS_COLORS[stage]}` : "bg-gray-300"
                  }`}
                ></div>
              )}

              {/* Stage label */}
              <span
                className={`text-xs font-semibold mt-1 ${
                  completed ? `text-${STATUS_COLORS[stage]}` : "text-gray-400"
                }`}
              >
                {stage}
              </span>

              {/* Date / location */}
              {historyItem && (
                <span className="text-[10px] text-gray-500 text-center">
                  {new Date(historyItem.date).toLocaleDateString()}
                  {historyItem.location ? ` - ${historyItem.location}` : ""}
                </span>
              )}
            </div>
          );
        })}
        <Footer/>
      </div>
    );
  };

  if (!isLoaded) return <div className="p-6 text-center">Loading user...</div>;
  if (!user) return <div className="p-6 text-center text-red-500">Please log in to see your orders.</div>;
  if (loading) return <div className="p-6 text-center">Loading your orders...</div>;
  if (orders.length === 0) return <div className="p-6 text-center text-gray-500">You have no orders yet. Start shopping!</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-4">My Orders</h2>

      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white shadow-lg rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-xl transition-shadow"
        >
          {/* Left: Items */}
          <div className="flex-1 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b pb-2">
                <img
                  src={item.product.images?.[0] || "/placeholder.png"}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{item.product.name}</h3>
                  <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                  <p className="text-sm font-semibold">₹{item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}

            <div className="flex justify-between font-semibold text-gray-800 mt-2">
              <span>Total:</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded text-white bg-${STATUS_COLORS[order.status]}`}
              >
                {order.status}
              </span>
              <span className="text-sm text-gray-600">{order.paymentMode}</span>
            </div>

            {order.expectedDelivery && (
              <div className="text-sm text-green-600 mt-1">
                Expected Delivery: {new Date(order.expectedDelivery).toLocaleDateString()}
              </div>
            )}

            {order.trackingNumber && (
              <div className="text-sm text-blue-600 mt-1 flex items-center gap-2">
                Tracking: {order.trackingNumber}
                <a
                  href={`https://track.aftership.com/${order.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-800 underline"
                >
                  Track Order
                </a>
              </div>
            )}

            <div className="mt-2 text-sm text-gray-500">Shipping Address: {order.address}</div>

            <div className="flex gap-2 mt-2">
              {(order.status === "PENDING" || order.status === "SHIPPED") && (
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                  onClick={() => updateOrderStatus(order.id, "CANCEL")}
                >
                  Cancel Order
                </button>
              )}
              {order.status === "DELIVERED" && (
                <button
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all"
                  onClick={() => updateOrderStatus(order.id, "RETURN")}
                >
                  Return Order
                </button>
              )}
            </div>
          </div>

          {/* Right: Vertical tracking timeline */}
          <div className="hidden md:flex">{renderTrackingTimeline(order)}</div>
        </div>
      ))}
      <Footer/>
    </div>
  );
}
