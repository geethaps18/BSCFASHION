// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return NextResponse.json({ orders: [] }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMode: order.paymentMode,

      // ⭐ Address is ALREADY an object, no parse needed
      address: order.address || {},

      expectedDelivery: order.expectedDelivery ?? null,
      trackingNumber: order.trackingNumber ?? null,

      createdAt: order.createdAt ?? new Date(0),
      updatedAt: order.updatedAt ?? null,
items: order.items
  .map((item) => {
    const product = item.product;

    if (!product) {
      // 🛡️ Skip broken product references
      return null;
    }

    return {
      itemId: item.id,
      siteId: product.siteId ?? null,
      name: product.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size ?? null,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: Array.isArray(product.images) ? product.images : [],
      },
    };
  })
  .filter(Boolean),


    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}
