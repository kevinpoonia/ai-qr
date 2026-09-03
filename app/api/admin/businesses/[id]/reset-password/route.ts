import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { findBusinessById, findOwnerForBusiness, setUserPassword } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/auditLog";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { password } = body as Record<string, unknown>;
  const cleanPassword = typeof password === "string" ? password : "";
  if (cleanPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const business = await findBusinessById(id);
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owner = await findOwnerForBusiness(id);
  if (!owner) {
    return NextResponse.json({ error: "This business has no owner account" }, { status: 404 });
  }

  await setUserPassword(owner.id, cleanPassword);
  await logAdminAction(session.userId, "reset_owner_password", id, owner.email);

  return NextResponse.json({ success: true, ownerEmail: owner.email });
}
