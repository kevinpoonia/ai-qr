import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PAGES = ["/login", "/qr"];
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/generate-review", "/api/events"];

function isPublic(pathname: string, method: string): boolean {
  if (PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;

  // The /qr flow needs to read settings and log/create customers without a session.
  if (pathname === "/api/settings" && method === "GET") return true;
  if (pathname === "/api/customers" && method === "POST") return true;
  if (pathname === "/api/feedback" && method === "POST") return true;

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname, request.method)) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authed = secret ? await verifySessionToken(token, secret) : false;

  if (authed) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
