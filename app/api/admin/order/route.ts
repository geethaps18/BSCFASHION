import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/utils/notify";

// Helper: Generate 6-digit OTP
function generateDeliveryOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET all orders
export async function GET(req: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

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

// UPDATE ORDER STATUS
export async function PUT(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    // Fetch order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order)
      return NextResponse.json({ message: "Order not found" }, { status: 404 });

    let deliveryOtp: string | null = null;

    // ⭐⭐⭐ Generate OTP when status moves to OUT_FOR_DELIVERY
    if (status === "OUT_FOR_DELIVERY") {
      deliveryOtp = generateDeliveryOtp();

      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryOtp,
          otpGeneratedAt: new Date(),
          otpVerified: false,
        },
      });

      console.log("DELIVERY OTP:", deliveryOtp);
    }

    // Update STATUS normally
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    const parsedAddress =
      updated.address ? JSON.parse(updated.address) : {};

    // Map items
    const itemsForNotification = updated.items.map((item: any) => ({
      name: item.product?.name ?? "Unnamed Product",
      qty: item.quantity,
      price: item.price,
      size: item.size ?? undefined,
      image: item.product?.images?.[0] ?? undefined,
    }));

    // Send notifications (includes OTP message)
    await sendOrderNotification({
      email: updated.user?.email ?? "",
      phone: updated.user?.phone ?? "",
      customerName: updated.user?.name ?? "Customer",
      orderId: updated.id,
      items: itemsForNotification,
      total: updated.totalAmount,
      paymentMode: updated.paymentMode,
      status,
      deliveryOtp, // ⭐ send OTP only when created
    });

    return NextResponse.json({
      message: "Order status updated",
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
