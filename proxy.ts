import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PAGES = ["/login", "/signup"];
const PUBLIC_PAGE_PREFIXES = ["/qr/"];
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/signup", "/api/public/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.includes(pathname)) return true;
  if (PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = secret ? await verifySessionToken(token, secret) : null;

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  // Reachable by an impersonated owner/staff session (its role isn't
  // platform_admin), so it must not be caught by the admin-role gate below.
  const isExitImpersonation = pathname === "/api/admin/exit-impersonation";
  const isAuthRoute = pathname.startsWith("/api/auth/");

  if (session.role === "platform_admin") {
    if (!isAdminRoute && !isAuthRoute) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  } else if (isAdminRoute && !isExitImpersonation) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const headers = new Headers(request.headers);
  headers.set("x-user-id", String(session.userId));
  if (session.businessId !== null) {
    headers.set("x-business-id", String(session.businessId));
  }
  headers.set("x-user-role", session.role);
  if (request.cookies.get(ADMIN_SESSION_COOKIE)?.value) {
    headers.set("x-impersonating", "1");
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
