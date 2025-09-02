// app/api/wishlist/remove/route.ts
import { NextResponse } from "next/server";
import db from "@/utils/db";

export async function POST(req: Request) {
  const { userId, productId } = await req.json();

  if (!userId || !productId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await db.wishlist.deleteMany({
    where: { userId, productId },
  });

  return NextResponse.json({ success: true });
}
