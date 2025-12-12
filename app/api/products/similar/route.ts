import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category")?.toLowerCase();
    const subCategory = url.searchParams.get("subCategory")?.toLowerCase();
    const subSubCategory = url.searchParams.get("subSubCategory")?.toLowerCase();
    const exclude = url.searchParams.get("exclude");
    const color = url.searchParams.get("color")?.toLowerCase();
    const size = url.searchParams.get("size")?.toLowerCase();
    const name = url.searchParams.get("name")?.toLowerCase();
    const limitStr = url.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 12;

    if (!category && !subCategory && !subSubCategory) {
      return NextResponse.json([], { status: 200 });
    }

    // Build Prisma filters based on hierarchy
    const where: any = {};

    if (exclude) where.id = { not: exclude };

    if (subSubCategory) {
      where.subSubCategory = { equals: subSubCategory, mode: "insensitive" };
    } else if (subCategory) {
      where.subCategory = { equals: subCategory, mode: "insensitive" };
    } else if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (name) where.name = { contains: name, mode: "insensitive" };
    if (color) where.colors = { some: { hex: { equals: color, mode: "insensitive" } } };
    if (size) where.sizes = { has: size };

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        mrp: true,
        discount: true,
        images: true,
        category: true,
        subCategory: true,
        subSubCategory: true,
        sizes: true,
      },
    });

    // Ensure images array
    const safeProducts = products.map(p => ({
      ...p,
      images: Array.isArray(p.images) ? p.images : [],
    }));

    return NextResponse.json(safeProducts);
  } catch (err: any) {
    console.error("GET /api/products/similar error:", err);
    return NextResponse.json(
      { message: "Failed to fetch similar products", error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
