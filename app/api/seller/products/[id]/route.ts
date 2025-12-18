import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

const SELLER_ID = "TEMP_SELLER_ID";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.product.updateMany({
    where: {
      id,
      sellerId: SELLER_ID,
    },
    data: body,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.product.deleteMany({
    where: {
      id,
      sellerId: SELLER_ID,
    },
  });

  return NextResponse.json({ success: true });
}
