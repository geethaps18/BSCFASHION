import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userId,
      items,
      totalAmount,
      paymentMode = "COD",
      address = "Not provided",
    } = body;

    // Validate required fields
    if (!userId || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return NextResponse.json({
        success: false,
        error: "Invalid order data. Ensure userId, items, and totalAmount are provided.",
      });
    }

    // Compute expected delivery (7 days from now)
    const now = new Date();
    const expectedDelivery = new Date();
    expectedDelivery.setDate(now.getDate() + 7);

    // Generate a tracking number (simple example)
    const trackingNumber = "TRK" + Math.floor(Math.random() * 1000000);

    // Create order in database
    const order = await db.order.create({
      data: {
        userId,
        totalAmount,
        paymentMode,
        address,
        status: "PENDING",          // Default status
        expectedDelivery,           // 7 days from now
        trackingNumber,             // Generated tracking number
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, orderId: order.id, trackingNumber });
  } catch (err) {
    console.error("Failed to create order:", err);
    return NextResponse.json({
      success: false,
      error: "Failed to create order. Check server logs for details.",
    });
  }
}
