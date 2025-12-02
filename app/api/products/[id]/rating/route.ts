// app/api/products/[id]/rating/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { promises } from "dns";

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// GET — Fetch product rating
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        rating: true,
        reviewCount: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      rating: product.rating ?? 0,
      reviewCount: product.reviewCount ?? 0,
    });
  } catch (err) {
    console.error("Rating GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch rating" },
      { status: 500 }
    );
  }
}

// POST — Update product rating (admin or system)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const { rating, reviewCount } = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        rating: rating ?? undefined,
        reviewCount: reviewCount ?? undefined,
      },
    });

    return NextResponse.json({
      message: "Rating updated",
      product,
    });
  } catch (err) {
    console.error("Rating POST error:", err);
    return NextResponse.json(
      { error: "Failed to update rating" },
      { status: 500 }
    );
  }
}
