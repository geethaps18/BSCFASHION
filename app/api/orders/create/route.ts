import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items, totalAmount, address } = body;

    if (!userId || !items?.length || !address) {
      return NextResponse.json(
        { success: false, error: "Invalid order data" },
        { status: 400 }
      );
    }

    // 1️⃣ Create Order (Courier based)
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        address: JSON.stringify(address), // store full address snapshot
        status: "PENDING",
       // ✅ optional but recommended
      },
    });

    // 2️⃣ Create Order Items
    await prisma.orderItem.createMany({
      data: items.map((item: any) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
      })),
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("ORDER CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
