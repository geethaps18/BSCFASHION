// app/api/orders/[id]/route.ts
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
export async function GET(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split("/"); // ["", "api", "orders", "{id}"]
    const id = parts[parts.length - 1];

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order with products and their reviews
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                reviews: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    type OrderItemWithProduct = typeof order.items[number];

    // Format order for frontend
    const formattedOrder = {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      address: order.address ? JSON.parse(order.address) : null,
      items: order.items.map((item: OrderItemWithProduct) => ({
        id: item.id,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
        name: item.name ?? item.product?.name ?? "",
        description: item.product?.description ?? "",
        images: Array.isArray(item.product?.images) ? item.product.images : [],
        rating: item.product?.rating ?? 0,
        reviewCount: item.product?.reviewCount ?? 0,
        reviews: item.product?.reviews?.map((r) => ({
          id: r.id,
          userId: r.userId,
          rating: r.rating,
          review: r.review,
          comment: r.comment,
          images: r.images,
          createdAt: r.createdAt,
        })) || [],
      })),
    };

    return NextResponse.json({ order: formattedOrder }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/**
 * =========================
 * POST — Create Review
 * =========================
 */
export async function POST(req: NextRequest) {
  try {
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

    // 1️⃣ Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId,       // optional
        rating,
        comment,
        images: images || [],
      },
    });

    // 2️⃣ Update product's average rating & review count
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
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
