import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/builder/orders?siteId=xxx
 * Seller-side orders (OrderItem based)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json({ orders: [] });
    }

    const items = await prisma.orderItem.findMany({
      where: { siteId },
      select: {
        id: true,
        orderId: true,
        name: true,
        brandName: true,
        quantity: true,
        price: true,
        size: true,
        image: true,
        createdAt: true,

        product: {
          select: { images: true },
        },

        order: {
          select: {
            status: true,
            paymentMode: true,
            confirmedAt: true,
            address: true,
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const orders = items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      status: item.order?.status,
      paymentMode: item.order?.paymentMode,
      confirmedAt: item.order?.confirmedAt ?? null,

      customer: item.order?.user,
      address: item.order?.address,

      name: item.name,
      brandName: item.brandName,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      image:
        item.image ||
        item.product?.images?.[0] ||
        "/no-image.png",
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("BUILDER ORDERS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller orders" },
      { status: 500 }
    );
  }
}
