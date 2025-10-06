import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOrderNotification } from "@/utils/notify";

// GET all orders (admin)
export async function GET(req: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: true, // fetch product details
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// PUT: update order status + send notifications
export async function PUT(req: NextRequest) {
  try {
    const { orderId, status } = await req.json();

    // 1️⃣ Fetch order with user and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });

    // 2️⃣ Update status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    // 3️⃣ Map items for notification
    const itemsForNotification = updatedOrder.items.map((item) => ({
      name: item.product?.name ?? "Unnamed Product",
      qty: item.quantity,
      price: item.price,
      size: item.size ?? undefined,
      image: item.product?.images?.[0] ?? undefined,
    }));

    // 4️⃣ Send notification to that user
    await sendOrderNotification({
      email: updatedOrder.user?.email ?? "unknown@example.com",
      phone: updatedOrder.user?.phone ?? "0000000000",
      customerName: updatedOrder.user?.name ?? "Customer",
      orderId: updatedOrder.id,
      items: itemsForNotification,
      total: updatedOrder.totalAmount,
      paymentMode: updatedOrder.paymentMode,
      status: status as any,
    });

    return NextResponse.json({ message: "Order status updated", order: updatedOrder });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to update order" },
      { status: 500 }
    );
  }
}
