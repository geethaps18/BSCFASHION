// app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  id: string;
}

export async function GET(req: Request, context: { params: Params }) {
  try {
    // ✅ Await params in App Router
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order with items and related product data
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true, // includes product details
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Format the order for frontend
    const formattedOrder = {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      address: order.address ? JSON.parse(order.address) : null, // parse address JSON
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        size: item.size,
        price: item.product?.price ?? 0,
        name: item.product?.name ?? "",
        description: item.product?.description ?? "",
        images: Array.isArray(item.product?.images) ? item.product.images : [],
        rating: item.product?.rating ?? 0,
        reviewCount: item.product?.reviewCount ?? 0,
      })),
    };

    return NextResponse.json({ order: formattedOrder }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
