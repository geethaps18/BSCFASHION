import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { category: string } }
) {
  const category = decodeURIComponent(params.category);

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
    take: 2, // 👈 Vuori-style: only 1–2 hero images
  });

  return NextResponse.json(products);
}
