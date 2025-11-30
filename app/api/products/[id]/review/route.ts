import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Helper: get userId from Bearer token
function getCurrentUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// Helper: validate MongoDB ObjectId
function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// GET: fetch product reviews
export async function GET(req: NextRequest, { params }: { params: any }) {
  const { id } = params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { reviews: { orderBy: { createdAt: "desc" } } },
  });

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    reviews: product.reviews,
  });
}

// POST: create or update review
export async function POST(req: NextRequest, { params }: { params: any }) {
  const { id: productId } = params;
  if (!isValidObjectId(productId)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

  const userId = getCurrentUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rating, comment, images } = await req.json();
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Check if user purchased & delivered this product
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: { some: { productId } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "You can review only purchased products" }, { status: 400 });
  }

  // Upsert review
  const existingReview = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  let review;
  if (existingReview) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment,
        images: images || [],
        updatedAt: new Date(),
        orderId: order.id,
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId: order.id,
        rating,
        comment,
        images: images || [],
      },
    });
  }

  // Recalculate average rating & review count
  const aggregate = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggregate._avg.rating ?? 0,
      reviewCount: aggregate._count.rating,
    },
  });

  return NextResponse.json({ message: "Review submitted successfully", review });
}
