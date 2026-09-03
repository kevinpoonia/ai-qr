import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { createBusinessWithOwner, findUserByEmail } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/auditLog";
import { BUSINESS_CATEGORIES, DEFAULT_CATEGORY_SLUG } from "@/lib/categories";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = await db();
  const rows = await sql`
    SELECT b.id, b.name, b.slug, b.location, b.google_reviews_url, b.feedback_mode, b.status, b.category, b.created_at,
           (SELECT email FROM users WHERE business_id = b.id AND role = 'owner' ORDER BY id ASC LIMIT 1) AS owner_email
    FROM businesses b
    ORDER BY b.created_at DESC
  `;

  return NextResponse.json({ businesses: rows });
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

  const { businessName, location, email, password, category } = body as Record<string, unknown>;
  const cleanBusinessName = typeof businessName === "string" ? businessName.trim() : "";
  const cleanLocation = typeof location === "string" ? location.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPassword = typeof password === "string" ? password : "";
  const cleanCategory =
    typeof category === "string" && BUSINESS_CATEGORIES.some((c) => c.slug === category)
      ? category
      : DEFAULT_CATEGORY_SLUG;

  if (!cleanBusinessName) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  if (!cleanEmail.includes("@") || cleanEmail.length < 5) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (cleanPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  if (await findUserByEmail(cleanEmail)) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const { businessId, slug } = await createBusinessWithOwner(
    cleanBusinessName,
    cleanEmail,
    cleanPassword,
    cleanLocation,
    cleanCategory
  );

  await logAdminAction(session.userId, "onboard_client", businessId, cleanBusinessName);

  return NextResponse.json({ id: businessId, slug }, { status: 201 });
}
