import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnerId } from "@/utils/getOwnerId";

export async function PUT(req: Request) {
  try {
    const ownerId = await getOwnerId();
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderItemId } = await req.json();
    if (!orderItemId) {
      return NextResponse.json(
        { error: "Missing orderItemId" },
        { status: 400 }
      );
    }

    // ✅ Fetch item → product → site
    const item = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        product: {
          include: {
            site: true, // 👈 VERY IMPORTANT
          },
        },
      },
    });

    if (!item || !item.product?.site) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }

    // 🔐 OWNER CHECK
    if (item.product.site.ownerId !== ownerId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // ✅ CONFIRM / PACK
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        packed: true,
        packedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SELLER CONFIRM ERROR:", err);
    return NextResponse.json(
      { error: "Failed to confirm item" },
      { status: 500 }
    );
  }
}
