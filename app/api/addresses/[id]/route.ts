// app/api/addresses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { pathname } = new URL(req.url);
    const id = pathname.split("/").pop(); // get [id] from URL
    if (!id) return NextResponse.json({ error: "Address ID missing" }, { status: 400 });

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    return NextResponse.json({ address });
  } catch (err: any) {
    console.error("🔥 Fetch address error:", err);
    return NextResponse.json({ error: "Failed to fetch address" }, { status: 500 });
  }
}
