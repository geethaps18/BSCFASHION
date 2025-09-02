import { NextResponse } from "next/server";
import { db } from "@/utils/db";

// GET /api/account?userId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Find account by Clerk userId
    const account = await db.account.findFirst({
      where: { userId },
    });

    return NextResponse.json(account || {});
  } catch (error) {
    console.error("GET /api/account error:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

// POST /api/account
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, ...data } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Upsert account (create if not exists, update otherwise)
    const account = await db.account.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("POST /api/account error:", error);
    return NextResponse.json({ error: "Failed to save account" }, { status: 500 });
  }
}
