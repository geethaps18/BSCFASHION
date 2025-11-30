import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, context: Params) {
  try {
    const { id } = context.params;

    if (!id) {
      return NextResponse.json({ error: "order id required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("order-get:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
