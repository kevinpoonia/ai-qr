import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const totalScans = (
    db.prepare("SELECT COUNT(*) AS n FROM events WHERE type = 'scan'").get() as { n: number }
  ).n;

  const totalReviewsCompleted = (
    db.prepare("SELECT COUNT(*) AS n FROM events WHERE type = 'review_completed'").get() as {
      n: number;
    }
  ).n;

  const totalFeedbackSubmitted = (
    db.prepare("SELECT COUNT(*) AS n FROM feedback").get() as { n: number }
  ).n;

  const pendingFeedback = (
    db.prepare("SELECT COUNT(*) AS n FROM feedback WHERE status = 'new'").get() as { n: number }
  ).n;

  const ratingRows = db
    .prepare(
      `SELECT rating, COUNT(*) AS n FROM events WHERE type = 'rating' AND rating IS NOT NULL GROUP BY rating`
    )
    .all() as { rating: number; n: number }[];

  const ratingDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const row of ratingRows) {
    ratingDistribution[String(row.rating)] = row.n;
  }

  const trendRows = db
    .prepare(
      `SELECT date(created_at) AS day, type, COUNT(*) AS n
       FROM events
       WHERE created_at >= datetime('now', '-14 days') AND type IN ('scan', 'review_completed')
       GROUP BY day, type
       ORDER BY day ASC`
    )
    .all() as { day: string; type: string; n: number }[];

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
