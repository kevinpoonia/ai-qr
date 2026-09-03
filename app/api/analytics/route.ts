import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = await db();
  const businessId = session.businessId;

  const [scanRows, completedRows, feedbackTotalRows, pendingRows, ratingRows, trendRows] =
    await Promise.all([
      sql`SELECT COUNT(*) AS n FROM events WHERE business_id = ${businessId} AND type = 'scan'`,
      sql`SELECT COUNT(*) AS n FROM events WHERE business_id = ${businessId} AND type = 'review_completed'`,
      sql`SELECT COUNT(*) AS n FROM feedback WHERE business_id = ${businessId}`,
      sql`SELECT COUNT(*) AS n FROM feedback WHERE business_id = ${businessId} AND status = 'new'`,
      sql`
        SELECT rating, COUNT(*) AS n FROM events
        WHERE business_id = ${businessId} AND type = 'rating' AND rating IS NOT NULL
        GROUP BY rating
      `,
      sql`
        SELECT to_char(created_at, 'YYYY-MM-DD') AS day, type, COUNT(*) AS n
        FROM events
        WHERE business_id = ${businessId}
          AND created_at >= now() - interval '14 days'
          AND type IN ('scan', 'review_completed')
        GROUP BY day, type
        ORDER BY day ASC
      `,
    ]);

  const totalScans = Number((scanRows[0] as { n: number | string }).n);
  const totalReviewsCompleted = Number((completedRows[0] as { n: number | string }).n);
  const totalFeedbackSubmitted = Number((feedbackTotalRows[0] as { n: number | string }).n);
  const pendingFeedback = Number((pendingRows[0] as { n: number | string }).n);

  const ratingDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const row of ratingRows as { rating: number; n: number | string }[]) {
    ratingDistribution[String(row.rating)] = Number(row.n);
  }

  const trendMap = new Map<string, { day: string; scans: number; completions: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.toISOString().slice(0, 10);
    trendMap.set(day, { day, scans: 0, completions: 0 });
  }
  for (const row of trendRows as { day: string; type: string; n: number | string }[]) {
    const entry = trendMap.get(row.day);
    if (!entry) continue;
    if (row.type === "scan") entry.scans = Number(row.n);
    if (row.type === "review_completed") entry.completions = Number(row.n);
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
