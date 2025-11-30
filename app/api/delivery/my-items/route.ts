import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Read delivery boy UUID from headers
    const deliveryBoyUuid = req.headers.get("x-delivery-boy-id");
    if (!deliveryBoyUuid)
      return NextResponse.json(
        { error: "deliveryBoyId header required" },
        { status: 400 }
      );

    // 2️⃣ Find delivery boy by UUID
    const deliveryBoy = await prisma.deliveryBoy.findUnique({
      where: { deliveryBoyId: deliveryBoyUuid },
    });

    if (!deliveryBoy)
      return NextResponse.json(
        { error: "Delivery boy not found" },
        { status: 404 }
      );

    // 3️⃣ Fetch order items assigned to this delivery boy
    const orderItems = await prisma.orderItem.findMany({
      where: {
        OR: [
          { deliveryBoyId: deliveryBoy.id }, // ObjectId
          { deliveryBoyId: deliveryBoy.deliveryBoyId }, // UUID
        ],
      },
      include: {
        product: true,
        order: {
          include: {
            user: { select: { name: true, phone: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4️⃣ Flatten items for dashboard
    const items = orderItems.map((item) => ({
      id: item.id,
      orderId: item.order.id,
      productName: item.product?.name || "Unknown Product",
      userName: item.order.user?.name || "Unknown Customer",
      userPhone: item.order.user?.phone || "",
      userEmail: item.order.user?.email || "",
      address: item.order.address || "",
      quantity: item.quantity,
      size: item.size,
      price: item.price,
      deliveryOtp: item.deliveryOtp,
      delivered: item.delivered,
      lastSentOtp: null, // optional for dev preview
    }));

    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error("my-items:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
