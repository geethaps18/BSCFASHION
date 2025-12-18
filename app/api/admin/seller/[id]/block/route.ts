import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: Context) {
  try {
    const { id } = await context.params; // 🔥 REQUIRED

    const seller = await prisma.user.findUnique({
      where: { id },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("GET SELLER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller" },
      { status: 500 }
    );
  }
}
