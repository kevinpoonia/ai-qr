import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import type { FeedbackMode } from "@/lib/types";

interface BusinessRow {
  name: string;
  slug: string;
  location: string;
  google_reviews_url: string;
  feedback_mode: FeedbackMode;
}

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const row = db
    .prepare(
      "SELECT name, slug, location, google_reviews_url, feedback_mode FROM businesses WHERE id = ?"
    )
    .get(session.businessId) as BusinessRow | undefined;

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({
    businessName: row.name,
    slug: row.slug,
    location: row.location,
    googleReviewsUrl: row.google_reviews_url,
    feedbackMode: row.feedback_mode,
  });
}

export async function PUT(request: Request) {
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

  const { businessName, location, googleReviewsUrl, feedbackMode } = body as Record<
    string,
    unknown
  >;
  const name = typeof businessName === "string" ? businessName.trim() : "";
  const place = typeof location === "string" ? location.trim() : "";
  const url = typeof googleReviewsUrl === "string" ? googleReviewsUrl.trim() : "";
  const mode = feedbackMode === "open" ? "open" : "gated";

  if (!url) {
    return NextResponse.json({ error: "googleReviewsUrl is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "googleReviewsUrl must be a valid URL" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    "UPDATE businesses SET name = ?, location = ?, google_reviews_url = ?, feedback_mode = ? WHERE id = ?"
  ).run(name, place, url, mode, session.businessId);

  return NextResponse.json({ businessName: name, location: place, googleReviewsUrl: url, feedbackMode: mode });
}
