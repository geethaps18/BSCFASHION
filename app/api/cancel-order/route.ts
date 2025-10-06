import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    // Update order status to CANCELLED
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Failed to cancel order:", err);
    return NextResponse.json({ success: false, error: "Failed to cancel order" }, { status: 500 });
  }
}
