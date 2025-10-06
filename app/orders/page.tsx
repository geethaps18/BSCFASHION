"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: string[] | null;
}

interface OrderItem {
  id: string;
  product: Product;
  size?: string;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  // No address here
}

const STATUS_TEXT: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
  SHIPPED: { text: "Shipped", color: "bg-blue-100 text-blue-800" },
  DELIVERED: { text: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { text: "Cancelled", color: "bg-red-100 text-red-800" },
  RETURNED: { text: "Returned", color: "bg-orange-100 text-orange-800" },
  REFUNDED: { text: "Refund Completed", color: "bg-gray-100 text-gray-800" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          toast.error("Failed to load orders");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading)
    return <div className="p-6 text-center">Loading orders...</div>;
  if (!loading && orders.length === 0)
    return <div className="p-6 text-center text-gray-500">No orders found</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Toaster />

      <main className="flex-1 max-w-3xl w-full mx-auto pt-[80px] pb-[80px] px-4">
        <div className="flex flex-col space-y-2">
          {orders.map((order) => {
            const firstItem = order.items[0]; // Show only first product preview
            return (
              <div
                key={order.id}
                className="flex items-center w-full py-3 cursor-pointer border-b-2"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <Image
                    src={firstItem?.product.images?.[0] || "/placeholder.png"}
                    alt={firstItem?.product.name || "Product"}
                    width={56}
                    height={56}
                    className="rounded bg-gray-50 border"
                  />
                </div>

                {/* Product & Status */}
                <div className="flex-1 ml-3 flex flex-col justify-center">
                  <div className="flex justify-between items-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_TEXT[order.status]?.color ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_TEXT[order.status]?.text || order.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 mt-1">
                    <div className="font-medium">{firstItem?.product.name}</div>
                    {firstItem?.product.description && (
                      <div className="text-gray-500 text-xs">
                        {firstItem.product.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="ml-4 flex-shrink-0 text-gray-400">
                  <ChevronRight size={20} />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
