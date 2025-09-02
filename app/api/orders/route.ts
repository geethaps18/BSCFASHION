import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId in query" },
        { status: 400 }
      );
    }

    // Fetch orders with items and product details
    const orders = await db.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the orders to include only necessary fields for frontend
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status, // PENDING, SHIPPED, DELIVERED, RETURNED, CANCELLED
      paymentMode: order.paymentMode,
      address: order.address,
      expectedDelivery: order.expectedDelivery,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          images: item.product.images,
        },
      })),
    }));

    return NextResponse.json({ success: true, orders: formattedOrders });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
