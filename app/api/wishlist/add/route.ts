import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined");

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const existing = await prisma.wishlist.findFirst({ where: { userId, productId } });
    if (existing) return NextResponse.json({ message: "Already in wishlist" });

    const wishlist = await prisma.wishlist.create({ data: { userId, productId } });
    return NextResponse.json(wishlist);
  } catch (err) {
    console.error("POST /wishlist/add error:", err);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}
