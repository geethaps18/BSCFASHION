// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ObjectId } from "mongodb";
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
  } catch (err) {
    console.error("JWT verify failed:", err);
    return null;
  }
}

// ----------------------
// Utility: Validate ObjectId
// ----------------------
function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// ----------------------
// GET: Fetch Product
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
        reviews: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// ----------------------
// DELETE: Delete Product
// ----------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deleted = await prisma.product.delete({ where: { id } });

    return NextResponse.json(
      { message: "✅ Product deleted!", product: deleted },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /product error:", err);
    return NextResponse.json(
      { message: "❌ Failed to delete product", error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------
// PUT: Update Product
// ----------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      include: { variants: true },
    });

    return NextResponse.json(
      { message: "✅ Product updated!", product: updated },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PUT /product error:", err);
    return NextResponse.json(
      { message: "❌ Failed to update product", error: err.message },
      { status: 500 }
    );
  }
}
