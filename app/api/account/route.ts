import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromToken } from "@/utils/getUserIdFormToken";

// ✅ GET profile
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await prisma.account.findUnique({
      where: { userId },
    });
    return NextResponse.json(account || {});
  } catch (err) {
    console.error("GET /api/account error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ PUT update profile
export async function PUT(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 🔑 Remove `id` if frontend sends it accidentally
    const { id, ...data } = body;

    const account = await prisma.account.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json(account);
  } catch (err) {
    console.error("PUT /api/account error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
