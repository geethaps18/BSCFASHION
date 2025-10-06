// app/api/orders/[id]/rate/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Validate MongoDB ObjectId
function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// GET rating
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

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
}

// POST rating
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const userId = "currentUserId"; // replace with auth user ID

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

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

  // Upsert rating
  await prisma.rating.upsert({
    where: { userId_productId: { userId, productId: id } },
    update: { rating: newRating },
    create: { userId, productId: id, rating: newRating },
  });

  const aggregate = await prisma.rating.aggregate({
    where: { productId: id },
    _avg: { rating: true },
    _count: { rating: true },
  });

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
}
