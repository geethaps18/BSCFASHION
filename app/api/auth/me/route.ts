import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function GET() {
  try {
    let cookieStore;

    const maybePromise = cookies();

    if (typeof (maybePromise as any).then === "function") {
      cookieStore = await maybePromise;
    } else {
      cookieStore = maybePromise;
    }

    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Force correct type
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      userId?: string;
      name?: string;
      email?: string;
      phone?: string;
    };

    if (!payload.userId) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      userId: payload.userId,
      name: payload.name || null,
      email: payload.email || null,
      phone: payload.phone || null,
    });
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
