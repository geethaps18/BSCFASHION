import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ---------------------------
// Extract userId from JWT
// ---------------------------
function getUserId(req: NextRequest) {
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = body?.productId;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // -------------------------------
    // Prevent duplicate reminders
    // -------------------------------
    const already = await prisma.stockReminder.findFirst({
      where: { userId, productId },
    });

    if (already) {
      return NextResponse.json(
        { message: "Reminder already added" },
        { status: 200 }
      );
    }

    // -------------------------------
    // Create new reminder
    // -------------------------------
    const reminder = await prisma.stockReminder.create({
      data: {
        userId,
        productId, // must be valid 24-char ObjectId string
      },
    });

    return NextResponse.json({
      message: "Reminder added!",
      reminder,
    });
  } catch (err) {
    console.error("REMINDER API ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
