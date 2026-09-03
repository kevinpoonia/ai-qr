import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { findBusinessById, isSlugTaken, slugify, updateBusinessById } from "@/lib/auth-server";
import { logAdminAction } from "@/lib/auditLog";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const business = await findBusinessById(id);
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ business });
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

  const existing = await findBusinessById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessName, location, googleReviewsUrl, feedbackMode, slug } = body as Record<
    string,
    unknown
  >;
  const name = typeof businessName === "string" ? businessName.trim() : existing.name;
  const place = typeof location === "string" ? location.trim() : existing.location;
  const url = typeof googleReviewsUrl === "string" ? googleReviewsUrl.trim() : existing.google_reviews_url;
  const mode = feedbackMode === "open" ? "open" : feedbackMode === "gated" ? "gated" : existing.feedback_mode;
  const cleanSlug = typeof slug === "string" && slug.trim() ? slugify(slug.trim()) : existing.slug;

  if (!name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }
  if (url) {
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "googleReviewsUrl must be a valid URL" }, { status: 400 });
    }
  }
  if (cleanSlug !== existing.slug && (await isSlugTaken(cleanSlug, id))) {
    return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
  }

  const business = await updateBusinessById(id, {
    name,
    location: place,
    googleReviewsUrl: url,
    feedbackMode: mode,
    slug: cleanSlug,
  });

  await logAdminAction(session.userId, "edit_client", id, name);

  return NextResponse.json({ business });
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

  const existing = await findBusinessById(id);

  const sql = await db();
  await sql`DELETE FROM businesses WHERE id = ${id}`;

  await logAdminAction(session.userId, "delete_client", null, existing?.name ?? `#${id}`);

  return NextResponse.json({ success: true });
}
