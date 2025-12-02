// app/api/delivery/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// =========================
// GET — Fetch order by ID
// =========================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("GET rorders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// =========================
// PUT — Update order (example)
// =========================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const body = await req.json();

    const updated = await prisma.order.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("PUT rorders error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// =========================
// DELETE — Delete order
// =========================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE rorders error:", err);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
