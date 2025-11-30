import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ObjectId } from "bson"; // install 'bson' if needed

interface RateBody {
  rating: number;
  comment?: string;
  images?: string[];
}

// Utility to get orderId from URL
function getOrderIdFromUrl(req: Request) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  return segments[segments.length - 2]; 
}

export async function POST(req: Request) {
  try {
    const orderId = getOrderIdFromUrl(req);
    if (!orderId) return NextResponse.json({ error: "Missing order ID" }, { status: 400 });

    const body: RateBody = await req.json();
    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    const product = order?.items[0]?.product;
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Use a valid ObjectId for userId
    const userId = new ObjectId().toHexString(); // generates a new valid ObjectId

    // Create review globally
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        orderId,
        userId, // now valid
        rating: body.rating,
        comment: body.comment,
        images: body.images,
      },
    });

    // Update product's average rating & review count
    const allReviews = await prisma.review.findMany({ where: { productId: product.id } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: product.id },
      data: { rating: avgRating, reviewCount: allReviews.length },
    });

    return NextResponse.json({ message: "Review submitted", review });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
