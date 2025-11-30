// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

interface Params {
  id: string | string[];
}

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
// Helper: Convert string to ObjectId if needed
// ----------------------
function parseId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return id; // fallback as string
  }
}

// ----------------------
// GET: Fetch Product
// ----------------------
export async function GET(
  req: NextRequest,
  context: { params: Params }
) {
  try {
    // Await params first
    const params = await context.params; 
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!rawId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: rawId },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err: any) {
    console.error("GET /product error:", err);
    return NextResponse.json(
      { message: "Failed to fetch product", error: err.message },
      { status: 500 }
    );
  }
}


// ----------------------
// DELETE: Delete Product (Auth required)
// ----------------------
export async function DELETE(
  req: NextRequest,
  context: { params: Params }
) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawId = Array.isArray(context.params.id) ? context.params.id[0] : context.params.id;
    if (!rawId) return NextResponse.json({ message: "Product ID is required" }, { status: 400 });

    const deleted = await prisma.product.delete({ where: { id: rawId } });
    return NextResponse.json({ message: "✅ Product deleted!", product: deleted }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /product error:", err);
    return NextResponse.json(
      { message: "❌ Failed to delete product", error: err.message },
      { status: 500 }
    );
  }
}

// ----------------------
// PUT: Update Product (Auth required)
// ----------------------
export async function PUT(
  req: NextRequest,
  context: { params: Params }
) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawId = Array.isArray(context.params.id) ? context.params.id[0] : context.params.id;
    if (!rawId) return NextResponse.json({ message: "Product ID is required" }, { status: 400 });

    const body = await req.json();
    const { name, description, price, stock, category } = body;

    const updated = await prisma.product.update({
      where: { id: rawId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
        ...(category && { category }),
      },
      include: { variants: true },
    });

    return NextResponse.json({ message: "✅ Product updated!", product: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /product error:", err);
    return NextResponse.json(
      { message: "❌ Failed to update product", error: err.message },
      { status: 500 }
    );
  }
}
