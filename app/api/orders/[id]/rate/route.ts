// app/api/orders/[id]/rate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RateBody {
  rating: number;
}

export async function POST(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    // Parse body
    const body: RateBody = await req.json();
    const { rating } = body;

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const firstItem = order.items[0];
    if (!firstItem || !firstItem.productId) {
      return NextResponse.json(
        { error: "Product not found in order" },
        { status: 404 }
      );
    }

    // Update product rating
    await prisma.product.update({
      where: { id: firstItem.productId },
      data: { rating },
    });

    return NextResponse.json(
      { message: "Rating submitted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Failed to submit rating:", err);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}
