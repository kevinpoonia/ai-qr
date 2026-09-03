import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { createStaffUser, findUserByEmail } from "@/lib/auth-server";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = await db();
  const rows = await sql`
    SELECT id, email, role, created_at FROM users
    WHERE business_id = ${session.businessId} ORDER BY created_at ASC
  `;

  return NextResponse.json({ users: rows });
}

export async function POST(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can add team members" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = body as Record<string, unknown>;
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (cleanPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (await findUserByEmail(cleanEmail)) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const { userId } = await createStaffUser(session.businessId, cleanEmail, cleanPassword);
  return NextResponse.json({ id: userId, email: cleanEmail, role: "staff" }, { status: 201 });
}
