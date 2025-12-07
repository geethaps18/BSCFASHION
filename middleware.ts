import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const ADMIN_EMAIL = "geethaps2001@gmail.com";
const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token")?.value;

  // -----------------------------
  // 1️⃣ USER PROTECTED ROUTES
  // -----------------------------
  const protectedPaths = ["/wishlist", "/bag", "/account", "/orders"];
  const isProtected = protectedPaths.some((path) =>
    url.pathname.startsWith(path)
  );

  if (!token && isProtected) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // -----------------------------
  // 2️⃣ ADMIN PROTECTED ROUTES
  // -----------------------------
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      // Not logged in → go to login
      return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);

      // NOT ADMIN → redirect to home
      if (decoded.contact !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

// Apply middleware to both user & admin routes
export const config = {
  matcher: [
    "/wishlist",
    "/bag",
    "/account",
    "/admin/:path*", // 👈 NEW ADMIN PROTECTION
  ],
};
