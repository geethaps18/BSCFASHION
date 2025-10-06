import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token")?.value;

  // Define protected routes
  const protectedPaths = ["/wishlist", "/bag", "/account"];
  const isProtected = protectedPaths.some((path) =>
    url.pathname.startsWith(path)
  );

  if (!token && isProtected) {
    // Save current path in "redirect" query param
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/wishlist", "/bag", "/account"],
};

