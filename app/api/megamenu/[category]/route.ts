import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;

  const products = await prisma.product.findMany({
    where: {
      category: {
        equals: category,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      images: true,
    },
    take: 2, // Vuori-style hero items
  });

  return NextResponse.json(products);
}
