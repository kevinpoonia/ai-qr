import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { FeedbackMode } from "@/lib/types";

interface SettingsRow {
  business_name: string;
  google_reviews_url: string;
  feedback_mode: FeedbackMode;
}

export async function GET() {
  const db = getDb();
  const row = db
    .prepare("SELECT business_name, google_reviews_url, feedback_mode FROM settings WHERE id = 1")
    .get() as SettingsRow | undefined;

  return NextResponse.json({
    businessName: row?.business_name ?? "",
    googleReviewsUrl: row?.google_reviews_url ?? "",
    feedbackMode: row?.feedback_mode ?? "gated",
  });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { businessName, googleReviewsUrl, feedbackMode } = body as Record<string, unknown>;
  const name = typeof businessName === "string" ? businessName.trim() : "";
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
    "UPDATE settings SET business_name = ?, google_reviews_url = ?, feedback_mode = ?, updated_at = datetime('now') WHERE id = 1"
  ).run(name, url, mode);

  return NextResponse.json({ businessName: name, googleReviewsUrl: url, feedbackMode: mode });
}
