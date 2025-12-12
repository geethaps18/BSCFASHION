import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* --------------------- Helpers --------------------- */
function startOfDay(dt: Date) {
  const d = new Date(dt);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dt: Date) {
  const d = new Date(dt);
  d.setHours(23, 59, 59, 999);
  return d;
}

/* --------------------- MAIN API --------------------- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get("range");
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");

    let startDate: Date;
    let endDate: Date = new Date();

    /* -------- Date Range Logic -------- */
    if (startParam && endParam) {
      startDate = startOfDay(new Date(startParam));
      endDate = endOfDay(new Date(endParam));
    } else if (range === "today") {
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
    } else if (range === "7") {
      startDate = startOfDay(new Date(Date.now() - 6 * 86400000));
      endDate = endOfDay(new Date());
    } else if (range === "month") {
      const now = new Date();
      startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      endDate = endOfDay(new Date());
    } else {
      startDate = startOfDay(new Date(Date.now() - 29 * 86400000));
      endDate = endOfDay(new Date());
    }

    /* -------- TOTALS -------- */
    const revenueTodayAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startOfDay(new Date()) }, status: "DELIVERED" },
    });

    const revenueRangeAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startDate, lte: endDate }, status: "DELIVERED" },
    });

    const totalOrders = await prisma.order.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const deliveredOrders = await prisma.order.count({
      where: { createdAt: { gte: startDate, lte: endDate }, status: "DELIVERED" },
    });

    const pendingOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["PENDING", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY"] },
      },
    });

    const totalCustomers = await prisma.user.count();

    const newCustomersInRange = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    /* -------- TOP CATEGORY -------- */
    const topCategoryGroup = await prisma.product.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    });

    /* ---------------------------------------------------
     * BEST SELLING PRODUCTS (FINAL FIXED VERSION)
     * --------------------------------------------------- */
  // BEST PRODUCTS (Works even if OrderItem has no `name`)
const bestProductsAgg = await prisma.$runCommandRaw({
  aggregate: "orderItem",
  pipeline: [
    {
      $lookup: {
        from: "order",
        localField: "orderId",
        foreignField: "_id",
        as: "order"
      }
    },
    { $unwind: "$order" },

    {
      $match: {
        "order.createdAt": { $gte: startDate, $lte: endDate }
      }
    },

    // JOIN PRODUCT TO GET NAME
    {
      $lookup: {
        from: "product",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },

    // GROUP BY PRODUCT ID
    {
      $group: {
        _id: "$productId",
        name: { $first: "$product.name" },
        sold: { $sum: "$quantity" },
        revenue: { $sum: { $multiply: ["$quantity", "$price"] } }
      }
    },

    { $sort: { sold: -1 } },
    { $limit: 10 }
  ],
  cursor: {}
});

// PARSE RAW OUTPUT
const raw = bestProductsAgg as any;

const bestProducts = (raw?.cursor?.firstBatch || []).map((p: any) => ({
  name: p.name,
  sold: p.sold,
  revenue: p.revenue,
}));


    /* -------- CATEGORY SALES -------- */
    const categoryItems = await prisma.orderItem.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { product: true },
    });

    const categoryMap = new Map<string, number>();

    categoryItems.forEach((item) => {
      const cat = item.product?.category || "Unknown";
      const total = item.quantity * item.price;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + total);
    });

    const categoryLabels = [...categoryMap.keys()];
    const categoryValues = [...categoryMap.values()];

    /* -------- DAILY REVENUE + CUSTOMER GROWTH -------- */
    const labels: string[] = [];
    const revenueValues: number[] = [];
    const customerValues: number[] = [];

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);

    for (let i = 0; i <= days; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);

      labels.push(day.toISOString().split("T")[0]);

      const dayRevenue = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
          status: "DELIVERED",
        },
      });

      const dayCustomers = await prisma.user.count({
        where: { createdAt: { gte: startOfDay(day), lte: endOfDay(day) } },
      });

      revenueValues.push(dayRevenue._sum.totalAmount || 0);
      customerValues.push(dayCustomers);
    }

    /* -------- RETURN JSON -------- */
    return NextResponse.json({
      totals: {
        revenueToday: revenueTodayAgg._sum.totalAmount || 0,
        revenueRange: revenueRangeAgg._sum.totalAmount || 0,
        totalOrders,
        deliveredOrders,
        pendingOrders,
        totalCustomers,
        newCustomersInRange,
        topCategory: topCategoryGroup?.[0]?.category || "N/A",
      },
      revenueSeries: { labels, values: revenueValues },
      categorySales: { labels: categoryLabels, values: categoryValues },
      customerGrowth: { labels, values: customerValues },
      bestProducts,
    });
  } catch (err) {
    console.error("ANALYTICS API ERROR:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
