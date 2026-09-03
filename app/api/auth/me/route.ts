import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(session.userId) as
    | { email: string }
    | undefined;

  return NextResponse.json({
    userId: session.userId,
    businessId: session.businessId,
    role: session.role,
    email: user?.email ?? "",
  });
}
