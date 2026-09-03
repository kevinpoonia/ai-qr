import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { FeedbackMode } from "@/lib/types";

interface BusinessRow {
  id: number;
  name: string;
  google_reviews_url: string;
  feedback_mode: FeedbackMode;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const row = db
    .prepare("SELECT id, name, google_reviews_url, feedback_mode FROM businesses WHERE slug = ?")
    .get(slug) as BusinessRow | undefined;

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({
    businessName: row.name,
    googleReviewsUrl: row.google_reviews_url,
    feedbackMode: row.feedback_mode,
  });
}
