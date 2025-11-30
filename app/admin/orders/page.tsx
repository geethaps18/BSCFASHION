"use client";

import { useState } from "react";
import useSWR from "swr";
import Footer from "@/components/Footer";
import { fetcher } from "@/lib/fetcher";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

interface Address {
  type: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  doorNumber?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

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
  address?: Address;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMode: string;
}

// Status Colors & Text
const STATUS_TEXT: Record<OrderStatus, { text: string; color: string }> = {
  PENDING: { text: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { text: "Confirmed", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { text: "Shipped", color: "bg-blue-300 text-white" },
  OUT_FOR_DELIVERY: {
    text: "Out for Delivery",
    color: "bg-purple-100 text-purple-800",
  },
  DELIVERED: { text: "Delivered", color: "bg-green-100 text-green-800" },
};

const statusStages: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

// ------------------------------
// DOWNLOAD PDF USING BACKEND API
// ------------------------------
const downloadPDF = async (order: Order) => {
  try {
    const res = await fetch("/api/orders/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        userName: order.user?.name || "Unknown",
        email: order.user?.email || "-",
        phone: order.address?.phone || "-",
        address: `${order.address?.doorNumber ?? ""}, ${
          order.address?.street ?? ""
        }, ${order.address?.landmark ?? ""}, ${order.address?.city ?? ""} ${
          order.address?.state ?? ""
        } - ${order.address?.pincode ?? ""}`,

        products: order.items.map((item) => ({
          name: item.product.name,
          variant: item.size ?? "-",
          qty: item.quantity,
          price: item.price * item.quantity,
        })),

        total: order.totalAmount,
        status: order.status,
        paymentMode: order.paymentMode, 
      }),
    });

    if (!res.ok) {
      alert("Failed to generate PDF");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${order.id}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PDF Download Error:", err);
  }
};

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
        mutate(
          (prev) => {
            if (!prev) return [updated.order];
            return prev.map((o) => (o.id === orderId ? updated.order : o));
          },
          false
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  if (!orders) return <div className="p-5">Loading Orders...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Order Management</h1>

      {orders.map((order) => {
        const currentIndex = statusStages.indexOf(order.status);

        return (
          
          <div
            key={order.id}
            className="border rounded-lg shadow mb-6 p-4 bg-white"
          >
      {/* HEADER */}
<div className="flex justify-between items-start mb-4">
  <div>
    <p className="font-semibold">Order ID: {order.id}</p>
    <p>
      User: {order.user?.name ?? "Unknown"} (
      {order.user?.email ?? "-"})
    </p>
    <p>
      Payment Mode:{" "}
      {["PhonePe", "GPay", "Google Pay", "Paytm", "Card"].includes(order.paymentMode)
        ? "Prepaid"
        : order.paymentMode === "COD"
        ? "Cash on Delivery"
        : order.paymentMode}
    </p>
  </div>




              <p
                className={`px-2 py-1 rounded text-sm ${STATUS_TEXT[order.status].color}`}
              >
                {STATUS_TEXT[order.status].text}
              </p>
            </div>

            {/* ADDRESS */}
            {order.address && (
              <div className="border p-3 rounded mb-4 bg-gray-50">
                <p className="font-semibold mb-1">Delivery Address</p>
                <p>
                  {order.address.name} ({order.address.phone})
                </p>
                <p>
                  {order.address.doorNumber}, {order.address.street},{" "}
                  {order.address.landmark}, {order.address.city},{" "}
                  {order.address.state} - {order.address.pincode}
                </p>
                <p>Type: {order.address.type}</p>
              </div>
            )}

            {/* TIMELINE */}
            <div className="flex items-center mb-4">
              {statusStages.map((stage, idx) => {
                const isCompleted = idx <= currentIndex;
                return (
                  <div key={stage} className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-gray-300 text-gray-500"
                      }`}
                    >
                      {isCompleted ? "✔" : idx + 1}
                    </div>
                    {idx < statusStages.length - 1 && (
                      <div
                        className={`flex-1 h-1 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mb-4">
              {currentIndex < statusStages.length - 1 && (
                <button
                  onClick={() =>
                    updateStatus(order.id, statusStages[currentIndex + 1])
                  }
                  className={`bg-blue-500 text-white px-3 py-1 rounded ${
                    loadingId === order.id
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={loadingId === order.id}
                >
                  {loadingId === order.id
                    ? "Updating..."
                    : `Move to ${
                        STATUS_TEXT[statusStages[currentIndex + 1]].text
                      }`}
                </button>
              )}

              <button
                onClick={() => downloadPDF(order)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Download PDF
              </button>
            </div>

            {/* PRODUCT LIST */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Products</h3>

              {order.items.length ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b py-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.images?.[0] ?? "/placeholder.png"}
                        className="w-16 h-16 object-cover rounded"
                      />

                      <div>
                        <p>
                          {item.product.name}{" "}
                          {item.size ? ` - ${item.size}` : ""}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No items found</p>
              )}
            </div>

            <p className="font-semibold text-right text-lg">
              Total: ₹{order.totalAmount}
            </p>
          </div>
        );
      })}
      

      <Footer />
    </div>
  );
}
