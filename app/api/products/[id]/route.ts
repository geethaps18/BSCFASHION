// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ----------------------
// Helper: Get userId from JWT
// ----------------------
function getUserId(req: NextRequest): string | null {
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}


// ----------------------
// Validate Mongo ObjectId
// ----------------------
function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// ----------------------
// ⭐ GET PRODUCT + REVIEWS
// ----------------------
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
        variants: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: { name: true }, // user may be null (SAFE)
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

   const averageRating =
  product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length
    : 0;

const normalized = {
  id: product.id,
  name: product.name ?? "",
  description: product.description ?? "",

  brandName: product.brandName ?? "BSCFASHION",
  category: product.category ?? null,

  images: (product.images ?? []).filter(
  (img) => typeof img === "string" && img.trim().length > 0
),


  price: product.price ?? 0,
  mrp: product.mrp ?? null,
  discount: product.discount ?? null,

  stock: product.stock ?? 0,

  rating: averageRating,
  reviewCount: product.reviews.length,

  // ✅ Sizes derived from variants (Shopify style)
  sizes:
    product.variants?.map(v => v.size).filter(Boolean) ?? [],

  variants: product.variants.map(v => ({
    id: v.id,
    color:v.color,
    size: v.size,
    price: v.price ?? product.price,
    stock: v.stock ?? 0,
    images: v.images ?? [],
  })),

  fit: product.fit ?? [],
  fabricCare: product.fabricCare ?? [],
  features: product.features ?? [],

  reviews: product.reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    userName: r.user?.name ?? "BSCFASHION User",
  })),
};




    return NextResponse.json(normalized);
  } catch (err) {
    console.error("Product GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ----------------------
// DELETE PRODUCT
// ----------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );

    const deleted = await prisma.product.delete({ where: { id } });

    return NextResponse.json(
      { message: "Product deleted!", product: deleted },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /product error:", err);
    return NextResponse.json(
      { message: "Failed to delete product", error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------
// UPDATE PRODUCT
// ----------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );

    const body = await req.json();
    const { name, description, price, stock, category } = body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
        ...(category && { category }),
      },
     
    });

    return NextResponse.json(
      { message: "Product updated!", product: updated },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PUT /product error:", err);
    return NextResponse.json(
      { message: "Failed to update product", error: err.message },
      { status: 500 }
    );
  }
}
