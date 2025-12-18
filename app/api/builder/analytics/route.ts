import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
} from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const SELLER_SHARE = 0.9; // 90% to seller, 10% platform cut


    const siteId = searchParams.get("siteId");
    const range = searchParams.get("range");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId required" },
        { status: 400 }
      );
    }

    let from: Date;
    let to: Date = new Date();

    switch (range) {
      case "7":
        from = subDays(new Date(), 7);
        break;
      case "month":
        from = startOfMonth(new Date());
        break;
      default:
        from = subDays(new Date(), 30);
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        items: { some: { siteId } },
      },
      include: { items: true },
    });

    const delivered = orders.filter(o => o.status === "DELIVERED");

  const grossRevenue = delivered.reduce(
  (s, o) => s + o.totalAmount,
  0
);

const revenueRange = Math.round(grossRevenue * SELLER_SHARE);


    const labels: string[] = [];
    const values: number[] = [];

    let cursor = startOfDay(from);
    while (cursor <= to) {
      const dayEnd = endOfDay(cursor);

     const dayGross = delivered
  .filter(o => o.createdAt >= cursor && o.createdAt <= dayEnd)
  .reduce((s, o) => s + o.totalAmount, 0);

const dayRevenue = Math.round(dayGross * SELLER_SHARE);


      labels.push(cursor.toISOString().slice(0, 10));
      values.push(dayRevenue);
      cursor = subDays(cursor, -1);
    }

    const items = await prisma.orderItem.findMany({
      where: {
        siteId,
        createdAt: { gte: from, lte: to },
      },
      include: { product: true },
    });

    const categoryMap: Record<string, number> = {};
    for (const i of items) {
      if (!i.product?.category) continue;
   categoryMap[i.product.category] =
  (categoryMap[i.product.category] || 0) +
  Math.round(i.price * i.quantity * SELLER_SHARE);

    }

    return NextResponse.json({
      totals: {
        revenueRange,
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        pendingOrders: orders.length - delivered.length,
        topCategory: Object.keys(categoryMap)[0] || "—",
      },
      revenueSeries: { labels, values },
      categorySales: {
        labels: Object.keys(categoryMap),
        values: Object.values(categoryMap),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Analytics failed" },
      { status: 500 }
    );
  }
}
