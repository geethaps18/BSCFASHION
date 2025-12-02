// app/api/orders/[id]/rate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ObjectId } from "bson";

interface RateBody {
  rating: number;
  comment?: string;
  images?: string[];
}

export async function POST(
  req: Request,
  {params}: { params: Promise<{ id: string }> }
) {
  try {
    const {id: orderId} = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    const body: RateBody = await req.json();

    if (
      typeof body.rating !== "number" ||
      body.rating < 1 ||
      body.rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be 1-5" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    const product = order?.items[0]?.product;

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // TEMP userId — you should replace this with real user auth
    const userId = new ObjectId().toHexString();

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        orderId,
        userId,
        rating: body.rating,
        comment: body.comment,
        images: body.images
      }
    });

    const allReviews = await prisma.review.findMany({
      where: { productId: product.id }
    });

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) /
      allReviews.length;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: avgRating,
        reviewCount: allReviews.length
      }
    });

    return NextResponse.json({
      message: "Review submitted",
      review
    });
  } catch (err) {
    console.error("RATE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
