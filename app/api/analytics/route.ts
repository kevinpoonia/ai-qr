import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const businessId = session.businessId;

  const totalScans = (
    db
      .prepare("SELECT COUNT(*) AS n FROM events WHERE business_id = ? AND type = 'scan'")
      .get(businessId) as { n: number }
  ).n;

  const totalReviewsCompleted = (
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM events WHERE business_id = ? AND type = 'review_completed'"
      )
      .get(businessId) as { n: number }
  ).n;

  const totalFeedbackSubmitted = (
    db.prepare("SELECT COUNT(*) AS n FROM feedback WHERE business_id = ?").get(businessId) as {
      n: number;
    }
  ).n;

  const pendingFeedback = (
    db
      .prepare("SELECT COUNT(*) AS n FROM feedback WHERE business_id = ? AND status = 'new'")
      .get(businessId) as { n: number }
  ).n;

  const ratingRows = db
    .prepare(
      `SELECT rating, COUNT(*) AS n FROM events
       WHERE business_id = ? AND type = 'rating' AND rating IS NOT NULL
       GROUP BY rating`
    )
    .all(businessId) as { rating: number; n: number }[];

  const ratingDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const row of ratingRows) {
    ratingDistribution[String(row.rating)] = row.n;
  }

  const trendRows = db
    .prepare(
      `SELECT date(created_at) AS day, type, COUNT(*) AS n
       FROM events
       WHERE business_id = ? AND created_at >= datetime('now', '-14 days') AND type IN ('scan', 'review_completed')
       GROUP BY day, type
       ORDER BY day ASC`
    )
    .all(businessId) as { day: string; type: string; n: number }[];

  const trendMap = new Map<string, { day: string; scans: number; completions: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    trendMap.set(day, { day, scans: 0, completions: 0 });
  }
  for (const row of trendRows) {
    const entry = trendMap.get(row.day);
    if (!entry) continue;
    if (row.type === "scan") entry.scans = row.n;
    if (row.type === "review_completed") entry.completions = row.n;
  }

  const conversionRate = totalScans > 0 ? totalReviewsCompleted / totalScans : 0;

  return NextResponse.json({
    totalScans,
    totalReviewsCompleted,
    totalFeedbackSubmitted,
    pendingFeedback,
    conversionRate,
    ratingDistribution,
    dailyTrend: Array.from(trendMap.values()),
  });
}
