import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { countPlatformAdmins, deletePlatformAdmin } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/auditLog";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (id === session.userId) {
    return NextResponse.json({ error: "You cannot remove your own admin account" }, { status: 400 });
  }

  if ((await countPlatformAdmins()) <= 1) {
    return NextResponse.json({ error: "Cannot remove the last admin account" }, { status: 400 });
  }

  const deleted = await deletePlatformAdmin(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await logAdminAction(session.userId, "remove_admin", null, `user #${id}`);

  return NextResponse.json({ success: true });
}
