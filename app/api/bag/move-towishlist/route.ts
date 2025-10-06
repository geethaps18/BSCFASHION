import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // ✅ Prisma client

export async function POST(req: Request) {
  try {
    const { userId, productId, size } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or productId" },
        { status: 400 }
      );
    }

    // 1️⃣ Remove from Bag
    await prisma.bag.deleteMany({
      where: {
        userId,
        productId,
        ...(size ? { size } : {}), // handle size if you store it
      },
    });

    // 2️⃣ Check if already in Wishlist
    const exists = await prisma.wishlist.findFirst({
      where: {
        userId,
        productId,
        ...(size ? { size } : {}),
      },
    });

    // 3️⃣ Add to Wishlist if not exists
    if (!exists) {
      await prisma.wishlist.create({
        data: {
          userId,
          productId,
          ...(size ? { size } : {}),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Move to wishlist error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
