import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySessionToken } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;

  const payload = secret ? await verifySessionToken(adminToken, secret) : null;

  const res = NextResponse.json({ success: Boolean(payload) });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });

  if (payload && payload.role === "platform_admin" && adminToken) {
    res.cookies.set(SESSION_COOKIE, adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
  } else {
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }

  return res;
}
