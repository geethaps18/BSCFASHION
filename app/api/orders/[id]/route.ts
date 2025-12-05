import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,          // order item id
            productId: true,   // REAL PRODUCT ID
            name: true,
            price: true,
            quantity: true,
            size: true,
            image: true,       // fallback image saved in order
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
                description: true,
              },
            },
          },
        },
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
        parsedAddress = { raw: order.address };
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


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const userId = getUserId(req);

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, orderId, rating, comment, images } = await req.json();

    if (!productId || !rating)
      return NextResponse.json(
        { error: "productId and rating required" },
        { status: 400 }
      );

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
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
