import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id;

    const wishlistEntries = await prisma.wishlist.findMany({
      where: { userId },
      include: { product: true },
    });

    const validEntries = wishlistEntries.filter(entry => entry.product !== null);

    return NextResponse.json({ items: validEntries });
  } catch (error) {
    console.error("GET /wishlist error:", error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}
