import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json({ error: "Missing userId or productId" }, { status: 400 });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return NextResponse.json({ added: false, message: "Removed from wishlist" });
    }

    await prisma.wishlist.create({
      data: { userId, productId },
    });

    return NextResponse.json({ added: true, message: "Added to wishlist" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ products: [] });
  }

  try {
    // Fetch all wishlist entries for the user, newest first
    const wishlistEntries = await prisma.wishlist.findMany({
      where: { userId },
      include: { product: true }, // Include the full product
      orderBy: { createdAt: "desc" }, // ✅ Most recently added first
    });

    // Map to only products
    const products = wishlistEntries.map((entry) => ({
      id: entry.product.id,
      name: entry.product.name,
      description: entry.product.description,
      price: entry.product.price,
      images: entry.product.images,
      category: entry.product.category,
      createdAt: entry.product.createdAt,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
