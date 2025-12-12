import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js requires awaiting params
    const { id } = await context.params;

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status required" },
        { status: 400 }
      );
    }

    // Track timestamps for status updates
    const timestampFields: any = {};

    if (status === "CONFIRMED") timestampFields.confirmedAt = new Date();
    if (status === "SHIPPED") timestampFields.shippedAt = new Date();
    if (status === "OUT_FOR_DELIVERY") timestampFields.outForDeliveryAt = new Date();
    if (status === "DELIVERED") timestampFields.deliveredAt = new Date();

    const updated = await prisma.order.update({
      where: { id },
      data: { status, ...timestampFields },
      include: { items: true, user: true },
    });

    return NextResponse.json({
      success: true,
      order: {
        ...updated,
        createdAt: updated.createdAt?.toISOString() ?? null,
        confirmedAt: updated.confirmedAt?.toISOString() ?? null,
        shippedAt: updated.shippedAt?.toISOString() ?? null,
        outForDeliveryAt: updated.outForDeliveryAt?.toISOString() ?? null,
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
        address: updated.address ? JSON.parse(String(updated.address)) : null,
      },
    });

  } catch (err: any) {
    console.error("STATUS UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
