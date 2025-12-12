"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ChevronRight, Search } from "lucide-react";
import { getCookie } from "cookies-next";
import LoadingRing from "@/components/LoadingRing";


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
}

const STATUS_TEXT: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
  PACKED: { text: "Packed", color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { text: "Shipped", color: "bg-blue-100 text-blue-800" },
  OUT_FOR_DELIVERY: {
    text: "Out for Delivery",
    color: "bg-orange-100 text-orange-800",
  },
  DELIVERED: { text: "Delivered", color: "bg-green-100 text-green-800" },
  CANCELLED: { text: "Cancelled", color: "bg-red-100 text-red-800" },
  RETURNED: { text: "Returned", color: "bg-gray-100 text-gray-800" },
  REFUNDED: { text: "Refund Completed", color: "bg-gray-200 text-gray-700" },
};


export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

   const router = useRouter();
  const token = getCookie("token");

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

  useEffect(() => {
    if (!token) {
      router.push("/login?redirect=orders");
    }
  }, [token, router]);


  // ----------------------
  // Filter + Search Logic
  // ----------------------
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch = order.items.some((item) =>
        item.product.name.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus =
        statusFilter === "ALL" || order.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);
if (loading)
  return (
    <div className="flex justify-center items-center py-20">
      <LoadingRing />
    </div>
  );


 

  return (
    <div className="min-h-screen flex flex-col ">
      <Header />
      <Toaster />

      <main className="flex-1 max-w-3xl w-full mx-auto pt-[80px] pb-[80px] px-4">
        {/* ------------------ Search + Filter Bar ------------------ */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your orders..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RETURNED">Returned</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

       {/* ------------------ Orders List ------------------ */}
<div className="flex flex-col divide-y divide-gray-400">
  {filteredOrders.length === 0 ? (
    <div className="text-center text-gray-500 mt-6">
      No matching orders found
    </div>
  ) : (
    filteredOrders.map((order) => {
      const firstItem = order.items[0];
      return (
        <div
          key={order.id}
          className="flex items-center w-full py-3 cursor-pointer px-2 hover:bg-gray-50 transition"
          onClick={() => router.push(`/orders/${order.id}`)}
        >
          {/* Product Image */}
          <div className="flex-shrink-0">
            <Image
              src={firstItem?.product.images?.[0] || "/placeholder.png"}
              alt={firstItem?.product.name || "Product"}
              width={56}
              height={56}
              className="rounded  border"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 ml-3 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  STATUS_TEXT[order.status]?.color ||
                  " text-gray-800"
                }`}
              >
                {STATUS_TEXT[order.status]?.text || order.status}
              </span>
              <span className="text-xs text-gray-900">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="text-sm text-gray-700 mt-1">
              <div className="font-medium text-gray-800">
                {firstItem?.product.name}
              </div>
              {firstItem?.product.description && (
                <div className="text-gray-500 text-xs truncate">
                  {firstItem.product.description}
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="ml-4 flex-shrink-0 text-gray-700">
            <ChevronRight size={20} />
          </div>
        </div>
      );
    })
  )}
</div>

      </main>

      <Footer />
    </div>
  );
}
