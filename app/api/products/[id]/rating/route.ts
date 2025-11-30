// app/api/products/[id]/ratig/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Validate MongoDB ObjectId
function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// GET: fetch product rating
export async function GET(req: Request, context: { params: any }) {
  const params = await context.params; // <-- Await params
  const { id } = params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { rating: true, reviewCount: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      rating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
    });
  } catch (error) {
    console.error("Error fetching product rating:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: add/update product rating
export async function POST(req: Request, context: { params: any }) {
  const params = await context.params; // <-- Await params
  const { id } = params;

  const userId = "currentUserId"; // TODO: Replace with real user ID from auth/session

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  try {
    const { newRating } = await req.json();

    if (typeof newRating !== "number" || newRating < 0 || newRating > 5) {
      return NextResponse.json({ error: "Invalid rating value" }, { status: 400 });
    }

    // Check if user purchased the product
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: "Delivered",
        items: { some: { productId: id } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "You can rate only purchased products" },
        { status: 400 }
      );
    }

    // Upsert user rating
    await prisma.rating.upsert({
      where: { userId_productId: { userId, productId: id } }, // composite unique key
      update: { rating: newRating },
      create: { userId, productId: id, rating: newRating },
    });

    // Recalculate average rating and total reviews
    const aggregate = await prisma.rating.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Update product with new rating stats
    await prisma.product.update({
      where: { id },
      data: {
        rating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });

    return NextResponse.json({
      message: "Rating updated successfully",
      rating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    });
  } catch (error) {
    console.error("Error updating product rating:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}  