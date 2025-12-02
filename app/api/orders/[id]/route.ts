import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

/**
 * Helper: Get userId from JWT token stored in cookies
 */
function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return (decoded as any).id;
  } catch {
    return null;
  }
}

/**
 * =========================
 * GET — Fetch Order Details
 * =========================
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
        
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let parsedAddress = null;
    if (order.address) {
      try {
        parsedAddress = JSON.parse(order.address);
      } catch {
        parsedAddress = { raw: order.address }; // fallback
      }
    }

    return NextResponse.json({
      success: true,
      order: { ...order, address: parsedAddress },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}


/**
 * =========================
 * POST — Create Review
 * =========================
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ✔ ADD THIS
) {
  try {
    // still unused, but required by Next.js to prevent warning:
    await params;

    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, orderId, rating, comment, images } = await req.json();

    if (!productId || !rating) {
      return NextResponse.json(
        { error: "productId and rating are required" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId,
        rating,
        comment,
        images: images || [],
      },
    });

    // Update product rating + count
    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating || 0,
        reviewCount: agg._count.rating || 0,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
