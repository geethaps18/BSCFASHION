import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOwnerId } from "@/utils/getOwnerId";

export async function GET() {
  const userId = await getOwnerId();
  if (!userId) return NextResponse.json(null);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // 🔥 HARD BLOCK
  if (user?.role !== "SELLER") {
    return NextResponse.json(
      { error: "Not a seller" },
      { status: 403 }
    );
  }

  const site = await prisma.site.findFirst({
    where: { ownerId: userId },
    select: { id: true, name: true, slug: true, brandName: true },
  });

  return NextResponse.json(site);
}
