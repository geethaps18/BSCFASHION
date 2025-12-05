// app/api/products/[id]/review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase"; 


const JWT_SECRET = process.env.JWT_SECRET!;

// Extract userId from token
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

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// =========================
// GET — Fetch Product Reviews
// =========================
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
      include: {
        reviews: {
          orderBy: { createdAt: "desc" }
        }
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
      reviews: product.reviews
    });
  } catch (err) {
    console.error("Review GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// =========================
// POST — Create / Update Review
// =========================
// =========================
// POST — Create / Update Review WITH REAL IMAGE UPLOAD
// =========================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const userId = getCurrentUser(req);

    if (!isValidObjectId(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating, comment, images } = await req.json();

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Check purchased + delivered
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        items: { some: { productId } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "You can review only purchased products" },
        { status: 400 }
      );
    }

    // -------------- IMAGE UPLOAD FIX --------------
    let uploadedUrls: string[] = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const base64 of images) {
        // Convert base64 → file buffer
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const fileName = `review-${Date.now()}-${Math.random()}.jpg`;

        const upload = await supabase.storage
          .from("reviews")
          .upload(fileName, buffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (!upload.error) {
          const { data } = supabase.storage.from("reviews").getPublicUrl(fileName);
          uploadedUrls.push(data.publicUrl);
        }
      }
    }

    // ------------------------------------------------

    // Check if review exists
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    let review;

    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating,
          comment,
          images: uploadedUrls.length > 0 ? uploadedUrls : existing.images,
          updatedAt: new Date(),
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
          images: uploadedUrls, // ONLY URLs
        },
      });
    }

    // Update avg rating
    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });

    return NextResponse.json({
      message: "Review submitted successfully",
      review,
    });
  } catch (err) {
    console.error("Review POST error:", err);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}

