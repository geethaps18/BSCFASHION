import { NextResponse, NextRequest } from "next/server";
import { updateOrderStatus } from "@/utils/updateOrderStatus";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js params must be awaited
    const { id } = await context.params;

    const { status } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status required" },
        { status: 400 }
      );
    }

    // 🔥 SINGLE SOURCE OF TRUTH
    // This updates DB + timestamps + sends EMAIL + WhatsApp
    const result = await updateOrderStatus(id, status);

    return NextResponse.json({
      success: true,
      order: {
        ...result.order,
        createdAt: result.order.createdAt?.toISOString() ?? null,
        confirmedAt: result.order.confirmedAt?.toISOString() ?? null,
        shippedAt: result.order.shippedAt?.toISOString() ?? null,
        outForDeliveryAt: result.order.outForDeliveryAt?.toISOString() ?? null,
        deliveredAt: result.order.deliveredAt?.toISOString() ?? null,
        address:
          result.order.address && typeof result.order.address === "object"
            ? result.order.address
            : null,
      },
    });

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
