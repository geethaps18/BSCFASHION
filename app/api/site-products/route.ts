import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get("siteId");
  const page = Number(searchParams.get("page") ?? 1);
  const limit = 12;

  const products = await prisma.product.findMany({
    where: { siteId: siteId! },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit + 1,
  });

  return NextResponse.json({
    products: products.slice(0, limit),
    hasMore: products.length > limit,
  });
}
