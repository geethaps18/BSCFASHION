// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers"; 
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ await here
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; [key: string]: any };

    return NextResponse.json({
      userId: payload.userId,
      name: payload.name || null,
      email: payload.email || null,
    });
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
