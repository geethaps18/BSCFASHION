import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productIds } = await req.json();
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ message: "No products to delete" });
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId,
        productId: { in: productIds },
      },
    });

    return NextResponse.json({ deleted: productIds });
  } catch (err) {
    console.error("Wishlist bulk delete error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
