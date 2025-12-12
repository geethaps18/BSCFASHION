import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ⭐ SAFE JSON PARSER
function safeJsonParse(value: any) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return String(value);

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const orderId = searchParams.get("id");
    if (!orderId) {
      return NextResponse.json({ error: "Order ID missing" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        paymentMode: order.paymentMode,

        customer: {
          name: order.user?.name || "Unknown",
          phone: order.user?.phone || "-",
          email: order.user?.email || "-",
        },

        // ⭐ FIXED — no type error
        address: safeJsonParse(order.address),

        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          image: item.image,
        })),
      },
    });
  } catch (error) {
    console.error("ADMIN ORDER ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
