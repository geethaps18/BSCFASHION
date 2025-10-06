import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

// GET wishlist
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ products: [] }, { status: 401 });
    }

    const entries = await prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });

    const products = entries
      .filter((entry) => entry.product !== null)
      .map((entry) => entry.product!);

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Wishlist GET error:", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

// POST toggle wishlist
export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 404 });
    }

    const existing = await prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ added: false });
    }

    await prisma.wishlist.create({
      data: { userId, productId },
    });

    return NextResponse.json({ added: true });
  } catch (err) {
    console.error("Wishlist POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
