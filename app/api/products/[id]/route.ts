import { NextResponse } from "next/server";
import db from "@/utils/db";

// ✅ GET single product by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await db.$connect();

    const product = await db.product.findUnique({
      where: { id }, // 👈 keep as string
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching product:", err);
    return NextResponse.json(
      { message: "Failed to fetch product", error: err.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE product by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await db.$connect();

    const deleted = await db.product.delete({
      where: { id }, // 👈 keep as string
    });

    return NextResponse.json(
      { message: "✅ Product deleted!", product: deleted },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error deleting product:", err);
    return NextResponse.json(
      { message: "❌ Failed to delete product", error: err.message },
      { status: 500 }
    );
  }
}
