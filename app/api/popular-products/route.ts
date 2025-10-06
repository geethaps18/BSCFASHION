// app/api/popular-products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // named export from db.ts

export async function GET() {
  try {
    // Fetch top 5 most purchased products
    const popularProducts = await prisma.product.findMany({
      orderBy: { purchases: "desc" },
      take: 5,
    });

    return NextResponse.json({ products: popularProducts });
  } catch (err: any) {
    console.error("GET /popular-products error:", err);
    return NextResponse.json(
      { products: [], message: "Failed to fetch popular products", error: err.message },
      { status: 500 }
    );
  }
}
