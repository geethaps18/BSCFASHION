import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

// PAGE SIZE (how many items per scroll load)
const PAGE_SIZE = 12;

// -----------------------
// GET Wishlist (Paginated)
// -----------------------
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { products: [], hasMore: false, page: 1 },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const skip = (page - 1) * PAGE_SIZE;

    // Count total items
    const total = await prisma.wishlist.count({
      where: { userId },
    });

    // Fetch paginated wishlist items
    const entries = await prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    });

    const products = entries
      .filter((entry) => entry.product !== null)
      .map((entry) => entry.product!);

    return NextResponse.json({
      products,
      hasMore: total > page * PAGE_SIZE,
      page,
    });
  } catch (err) {
    console.error("Wishlist GET error:", err);
    return NextResponse.json(
      { products: [], hasMore: false },
      { status: 500 }
    );
  }
}

// -----------------------
// POST Toggle Wishlist
// -----------------------
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
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

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
