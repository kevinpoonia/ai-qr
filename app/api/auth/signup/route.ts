import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { createBusinessWithOwner, findUserByEmail } from "@/lib/auth-server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessName, email, password } = body as Record<string, unknown>;
  const cleanBusinessName = typeof businessName === "string" ? businessName.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanBusinessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (cleanPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (findUserByEmail(cleanEmail)) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfigured: SESSION_SECRET is not set" },
      { status: 500 }
    );
  }

  const { businessId, userId, slug } = createBusinessWithOwner(
    cleanBusinessName,
    cleanEmail,
    cleanPassword
  );

  const token = await createSessionToken(secret, { userId, businessId, role: "owner" });
  const res = NextResponse.json({ success: true, slug });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
