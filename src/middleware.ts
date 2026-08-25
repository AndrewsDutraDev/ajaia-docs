import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function middleware(req: NextRequest) {
  const isLoggedIn = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isLoggedIn ? "/docs" : "/login", req.url));
  }

  if (pathname === "/login") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/docs", req.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/docs")) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/docs/:path*"],
};
