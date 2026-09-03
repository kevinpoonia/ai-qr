import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = await db();
  const rows = await sql`SELECT email FROM users WHERE id = ${session.userId}`;
  const user = rows[0] as { email: string } | undefined;

  return NextResponse.json({
    userId: session.userId,
    businessId: session.businessId,
    role: session.role,
    email: user?.email ?? "",
    impersonating: request.headers.get("x-impersonating") === "1",
  });
}
