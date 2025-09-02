import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function PATCH(req: NextRequest) {
  try {
    const { orderId, action } = await req.json(); // action = "CANCEL" | "RETURN"

    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
    }

    let newStatus = "";
    if (action === "CANCEL") newStatus = "CANCELLED";
    else if (action === "RETURN") newStatus = "RETURNED";
    else return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("Failed to update order:", err);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}
