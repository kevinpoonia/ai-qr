import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { createPlatformAdmin, findUserByEmail, listPlatformAdmins } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/auditLog";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await listPlatformAdmins();
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { userId } = await createPlatformAdmin(cleanEmail, cleanPassword);
  await logAdminAction(session.userId, "create_admin", null, cleanEmail);

  return NextResponse.json({ id: userId, email: cleanEmail }, { status: 201 });
}
