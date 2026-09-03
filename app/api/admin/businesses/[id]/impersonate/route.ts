import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionContext } from "@/lib/session";
import { findBusinessById, findOwnerForBusiness } from "@/lib/auth-server";
import { ADMIN_SESSION_COOKIE, createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
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
  const businessId = parseId(idParam);
  if (businessId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const business = await findBusinessById(businessId);
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const owner = await findOwnerForBusiness(businessId);
  if (!owner) {
    return NextResponse.json({ error: "This business has no owner account" }, { status: 404 });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfigured: SESSION_SECRET is not set" },
      { status: 500 }
    );
  }

  const token = await createSessionToken(secret, { userId: owner.id, businessId, role: "owner" });

  const cookieStore = await cookies();
  const currentAdminToken = cookieStore.get(SESSION_COOKIE)?.value;

  await logAdminAction(session.userId, "impersonate_client", businessId, business.name);

  const res = NextResponse.json({ success: true });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
  if (currentAdminToken) {
    res.cookies.set(ADMIN_SESSION_COOKIE, currentAdminToken, cookieOptions);
  }
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);

  return res;
}
