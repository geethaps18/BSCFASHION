import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const config = {
  matcher: [
    "/wishlist/:path*",
    "/bag/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/additems/:path*"

  ],
  runtime: "nodejs", // 👈 FIX: allow jwt.verify()
};

const ADMIN_CONTACT = process.env.NEXT_PUBLIC_ADMIN_CONTACT!;
const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token")?.value;

  console.log("🔵 [MIDDLEWARE] ADMIN_CONTACT =", ADMIN_CONTACT);
  console.log("🔵 [MIDDLEWARE] Token Exists =", !!token);

  // USER ROUTES
  const protectedUserRoutes = ["/wishlist", "/bag", "/account"];
  if (protectedUserRoutes.some(p => url.pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ADMIN ROUTES
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/additems")) {
 {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      console.log("🟡 Comparing:", decoded.contact, "vs", ADMIN_CONTACT);

      if (decoded.contact !== ADMIN_CONTACT) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (err) {
      console.log("❌ JWT ERROR:", err);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}}
