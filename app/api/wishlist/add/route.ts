// app/api/wishlist/add/route.ts
import { NextResponse } from "next/server";
import db from "@/utils/db";

export async function POST(req: Request) {
  const { userId, productId } = await req.json();

  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // prevent duplicates
  const existing = await db.wishlist.findFirst({
    where: { userId, productId },
  });

  if (existing) {
    return NextResponse.json({ message: "Already in wishlist" }, { status: 200 });
  }

  const wishlist = await db.wishlist.create({
    data: { userId, productId },
  });

  return NextResponse.json(wishlist);
}
