import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all orders assigned for delivery
export async function GET(req: NextRequest) {
  try {
    // Optionally, you can filter by deliveryBoyId in the future
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Ensure address is parsed
    const formatted = orders.map((o) => ({
      ...o,
      address: o.address ? JSON.parse(o.address) : {},
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// PUT: update order status (used for delivery)
export async function PUT(req: NextRequest) {
  try {
    const { orderId, status, otp } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // If delivering, verify OTP
    if (status === "DELIVERED") {
      if (order.deliveryOtp && order.deliveryOtp !== otp) {
        return NextResponse.json(
          { message: "Invalid OTP" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status, otpVerified: status === "DELIVERED" ? true : order.otpVerified },
      include: { user: true, items: { include: { product: true } } },
    });

    return NextResponse.json({
      message: `Order marked as ${status.replaceAll("_", " ")}`,
      order: updated,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to update order" },
      { status: 500 }
    );
  }
}
