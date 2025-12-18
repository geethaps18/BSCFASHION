// utils/getOwnerId.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getOwnerId() {
  const cookieStore = await cookies(); // ✅ MUST await
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded.userId; // 👈 REAL OWNER / SELLER ID
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
}
