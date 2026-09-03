import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface SettingsRow {
  business_name: string;
  google_reviews_url: string;
}

export async function GET() {
  const db = getDb();
  const row = db
    .prepare("SELECT business_name, google_reviews_url FROM settings WHERE id = 1")
    .get() as SettingsRow | undefined;

  return NextResponse.json({
    businessName: row?.business_name ?? "",
    googleReviewsUrl: row?.google_reviews_url ?? "",
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessName, googleReviewsUrl } = body as Record<string, unknown>;
  const name = typeof businessName === "string" ? businessName.trim() : "";
  const url = typeof googleReviewsUrl === "string" ? googleReviewsUrl.trim() : "";

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
    "UPDATE settings SET business_name = ?, google_reviews_url = ?, updated_at = datetime('now') WHERE id = 1"
  ).run(name, url);

  return NextResponse.json({ businessName: name, googleReviewsUrl: url });
}
