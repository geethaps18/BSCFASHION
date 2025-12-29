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

    // 1️⃣ Create Order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        address, // store JSON
        status: "PENDING",
      },
    });

    // 2️⃣ Process each item SAFELY
    for (const item of items) {
      // 🔥 Variant is REQUIRED
      if (!item.variantId) {
        throw new Error("Variant missing for product");
      }

      const variant = await prisma.productVariant.findFirst({
        where: {
          id: item.variantId,
          productId: item.productId,
        },
      });

      if (!variant || variant.stock < item.quantity) {
        throw new Error(
          `${item.productName ?? "Product"} (${item.size} ${item.color}) is out of stock`
        );
      }

      // 3️⃣ Reduce variant stock
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      // 4️⃣ Create order item
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          variantId: variant.id,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
    });
  } catch (error: any) {
    console.error("ORDER CREATE ERROR:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
