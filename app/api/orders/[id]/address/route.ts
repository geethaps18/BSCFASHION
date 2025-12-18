import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId || decoded.id || null;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ MUST await params in Next.js 15
    const { id } = await context.params;

    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const address = await req.json();

    // STEP 1: Fetch order
    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // STEP 2: Lock after shipped
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Address cannot be edited after order is shipped" },
        { status: 400 }
      );
    }

    // STEP 3: Update address
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { address },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("UPDATE ADDRESS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}
