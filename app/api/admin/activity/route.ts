import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { listRecentActivity } from "@/lib/auditLog";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activity = await listRecentActivity(20);
  return NextResponse.json({ activity });
}
