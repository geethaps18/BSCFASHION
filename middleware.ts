// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const config = {
  matcher: [
    "/wishlist/:path*",
    "/bag/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/additems/:path*",
    "/builder/:path*",
  ],
  runtime: "nodejs",
};

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_CONTACT!;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  /* ---------- User protected ---------- */
  const userRoutes = ["/wishlist", "/bag", "/account"];

  if (userRoutes.some((r) => url.pathname.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  /* ---------- Admin ---------- */
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/additems")
  ) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);

      if (decoded.contact !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

/* ---------- Seller / Builder ---------- */
/* ---------- Seller / Builder ---------- */
if (url.pathname.startsWith("/builder")) {
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // ✅ MUST BE SELLER
    if (decoded.role !== "SELLER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ MUST HAVE USER ID
    if (!decoded.userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}



}