import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { findBusinessById, setBusinessStatus } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/auditLog";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body as Record<string, unknown>;
  if (status !== "active" && status !== "suspended") {
    return NextResponse.json({ error: "status must be 'active' or 'suspended'" }, { status: 400 });
  }

  const existing = await findBusinessById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const business = await setBusinessStatus(id, status);
  await logAdminAction(
    session.userId,
    status === "suspended" ? "suspend_client" : "reactivate_client",
    id,
    existing.name
  );

  return NextResponse.json({ business });
}
