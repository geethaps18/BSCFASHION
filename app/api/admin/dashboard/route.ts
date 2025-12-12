import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Fetch basic stats
    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      deliveredOrders,
      outOfStock,
      todaySales,
      monthlyRevenue,
      topSelling
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.count({
        where: { status: { in: ["Order Placed", "Confirmed"] } }
      }),
      prisma.order.count({
        where: { status: "Delivered" }
      }),
      prisma.product.count({ where: { stock: 0 } }),

      prisma.order.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true }
      }),

      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalAmount: true }
      }),

      // Fixed: group by product.category instead of orderItem.category
      prisma.orderItem.findMany({
        include: { product: true },
      }),
    ]);

    // Calculate top category manually
    const categoryCount: Record<string, number> = {};

    topSelling.forEach((item) => {
      const category = item.product?.category || "Unknown";
      categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
    });

    const topCategory =
      Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    return NextResponse.json({
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      deliveredOrders,
      outOfStock,
      todaySales: todaySales._sum.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      topCategory
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
