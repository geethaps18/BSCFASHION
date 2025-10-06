// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

export async function GET(req: NextRequest) {
  try {
    // Extract user ID from JWT token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ orders: [] }, { status: 401 });
    }

    // Fetch all orders for the user with items and product info
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format orders safely
    const formattedOrders = orders.map((order) => {
      // Parse address JSON
      let parsedAddress: any = {};
      try {
        parsedAddress = order.address ? JSON.parse(order.address) : {};
      } catch (err) {
        console.warn("Failed to parse order address:", order.address);
      }

      return {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMode: order.paymentMode,
        address: parsedAddress,
        expectedDelivery: order.expectedDelivery ?? null,
        trackingNumber: order.trackingNumber ?? null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? null,
        items: order.items.map((item) => {
          const product = item.product;
          return {
            itemId: item.id,
            name: item.name ?? "Unknown Item",
            quantity: item.quantity,
            price: item.price,
            size: item.size ?? null,
            product: {
              id: product?.id ?? "",
              name: product?.name ?? "Unknown Product",
              price: product?.price ?? 0,
              images: Array.isArray(product?.images) ? product.images : [],
            },
          };
        }),
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}
