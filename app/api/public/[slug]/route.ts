import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BusinessStatus, FeedbackMode } from "@/lib/types";

interface BusinessRow {
  id: number;
  name: string;
  google_reviews_url: string;
  feedback_mode: FeedbackMode;
  status: BusinessStatus;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sql = await db();
  const rows = await sql`
    SELECT id, name, google_reviews_url, feedback_mode, status FROM businesses WHERE slug = ${slug}
  `;
  const row = rows[0] as BusinessRow | undefined;

  if (!row) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (row.status === "suspended") {
    return NextResponse.json({ suspended: true });
  }

  return NextResponse.json({
    businessName: row.name,
    googleReviewsUrl: row.google_reviews_url,
    feedbackMode: row.feedback_mode,
  });
}
