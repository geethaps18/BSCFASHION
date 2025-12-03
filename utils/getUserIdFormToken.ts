import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function getUserIdFromToken(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return (
      decoded.userId ||
      decoded.id ||
      decoded._id ||
      decoded.uid ||
      decoded.user ||
      null
    );
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}
