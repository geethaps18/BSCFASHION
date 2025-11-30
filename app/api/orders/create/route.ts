// app/api/orders/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, items, totalAmount, address } = body;

    // 1️⃣ Create the order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        address: JSON.stringify(address), // store full address as string
        status: "PENDING",
      },
    });

    // 2️⃣ Create order items
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
        },
      });
    }

    // 3️⃣ Assign delivery boy automatically based on city & pincode
    const deliveryBoy = await prisma.deliveryBoy.findFirst({
      where: {
        city: address.city,
        pincode: address.pincode,
      },
      orderBy: { orders: { _count: "asc" } }, // least busy first
    });

    if (deliveryBoy) {
      // Generate OTP for delivery verification
      const deliveryOtp = crypto.randomInt(100000, 999999).toString();

      await prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryBoyId: deliveryBoy.id,
          deliveryOtp,
          otpGeneratedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, deliveryBoy });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create order" });
  }
}
