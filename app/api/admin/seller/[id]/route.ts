import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  try {
    const { id } = await context.params;

    const seller = await prisma.user.findUnique({
      where: { id },
      include: {
        sites: true,
        products: true,
      },
    });

    if (!seller || seller.role !== "SELLER") {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("SELLER DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller" },
      { status: 500 }
    );
  }
}

