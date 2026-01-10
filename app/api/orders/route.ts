// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);

    if (!userId) {
      return NextResponse.json({ orders: [] }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentMode: order.paymentMode,

      // ⭐ Address is ALREADY an object, no parse needed
      address: order.address || {},

      expectedDelivery: order.expectedDelivery ?? null,
      trackingNumber: order.trackingNumber ?? null,

      createdAt: order.createdAt ?? new Date(0),
      updatedAt: order.updatedAt ?? null,
items: order.items
  .map((item) => {
    const product = item.product;

    if (!product) {
      // 🛡️ Skip broken product references
      return null;
    }

    return {
      itemId: item.id,
      siteId: product.siteId ?? null,
      name: product.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size ?? null,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        images: Array.isArray(product.images) ? product.images : [],
      },
    };
  })
  .filter(Boolean),


    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json({ orders: [] }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items, totalAmount, address, paymentMode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "No items in order" },
        { status: 400 }
      );
    }

    // 🔒 TRANSACTION = SAFE STOCK HANDLING
    const order = await prisma.$transaction(async (tx) => {
      // 1️⃣ CHECK + DECREMENT STOCK
      for (const item of items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant || variant.stock < item.quantity) {
            throw new Error("Variant out of stock");
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity, // 🔥 THIS FIXES YOUR ISSUE
              },
            },
          });
        }
      }

      // 2️⃣ CREATE ORDER
      return await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentMode,
          address,
          status: "PLACED",
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              quantity: item.quantity,
              price: item.price,
              size: item.size ?? null,
              color: item.color ?? null,
            })),
          },
        },
      });
    });

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("Order create error:", err);
    return NextResponse.json(
      { message: err.message || "Order failed" },
      { status: 500 }
    );
  }
}
