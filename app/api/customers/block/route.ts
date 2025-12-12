import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { id, blocked } = await req.json();

    const updated = await prisma.user.update({
      where: { id },
      data: { blocked },
    });

    return NextResponse.json({
      success: true,
      status: updated.blocked ? "blocked" : "active",
    });

  } catch (error) {
    console.error("BLOCK ERROR:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
