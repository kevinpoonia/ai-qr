import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { verifyPassword, setUserPassword } from "@/lib/auth-server";

export async function PATCH(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as Record<string, unknown>;

  if (typeof currentPassword !== "string" || !currentPassword) {
    return NextResponse.json({ error: "Current password is required" }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const sql = await db();
  const rows = await sql`
    SELECT password_hash, password_salt FROM users WHERE id = ${session.userId}
  `;
  const user = rows[0] as { password_hash: string; password_salt: string } | undefined;

  if (!user || !verifyPassword(currentPassword, user.password_hash, user.password_salt)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await setUserPassword(session.userId, newPassword);
  return NextResponse.json({ success: true });
}
