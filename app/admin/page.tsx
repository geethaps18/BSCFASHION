"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  Boxes,
  AlertTriangle,
  Users,
  BarChart2,
  Flame,
  Heart,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard load failed", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="h-12 w-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
    </div>
  );
}


  if (!stats) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load dashboard data.
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Sales Today",
      value: `₹${stats.todaySales}`,
      icon: <ShoppingBag className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <Package className="w-6 h-6 text-green-600" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      color: "bg-yellow-50 border-yellow-200",
    },
    {
      title: "Delivered Orders",
      value: stats.deliveredOrders,
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-200",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: <Boxes className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-50 border-purple-200",
    },
    {
      title: "Out of Stock Items",
      value: stats.outOfStock,
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
      color: "bg-red-50 border-red-200",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      color: "bg-indigo-50 border-indigo-200",
    },
    {
      title: "Revenue This Month",
      value: `₹${stats.monthlyRevenue}`,
      icon: <BarChart2 className="w-6 h-6 text-teal-600" />,
      color: "bg-teal-50 border-teal-200",
    },
    {
      title: "Top Selling Category",
      value: stats.topCategory,
      icon: <Flame className="w-6 h-6 text-orange-600" />,
      color: "bg-orange-50 border-orange-200",
    },
   {
  title: "Wishlist Count",
  value: stats.wishlistCount ?? 0,
  icon: <Heart className="w-6 h-6 text-pink-600" />,
  color: "bg-pink-50 border-pink-200",
},
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className={`border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${stat.color}`}
          >
            <div className="p-3 bg-white rounded-full shadow-sm">{stat.icon}</div>

            <div>
              <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
              <p className="text-xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
