import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = await db();

  const [businessCounts, totals, signupTrend, topBusinesses] = await Promise.all([
    sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'suspended') AS suspended
      FROM businesses
    `,
    sql`
      SELECT
        (SELECT COUNT(*) FROM customers) AS customers,
        (SELECT COUNT(*) FROM feedback) AS feedback,
        (SELECT COUNT(*) FROM events WHERE type = 'scan') AS scans,
        (SELECT COUNT(*) FROM events WHERE type = 'review_completed') AS reviews
    `,
    sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*) AS n
      FROM businesses
      WHERE created_at >= now() - interval '30 days'
      GROUP BY day
      ORDER BY day ASC
    `,
    sql`
      SELECT b.id, b.name, b.slug, COUNT(c.id) FILTER (WHERE c.review_count > 0) AS reviewers,
             COALESCE(SUM(c.review_count), 0) AS total_reviews
      FROM businesses b
      LEFT JOIN customers c ON c.business_id = b.id
      GROUP BY b.id, b.name, b.slug
      ORDER BY total_reviews DESC
      LIMIT 5
    `,
  ]);

  const counts = businessCounts[0] as { total: string; active: string; suspended: string };
  const t = totals[0] as { customers: string; feedback: string; scans: string; reviews: string };

  const signupMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    signupMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of signupTrend as { day: string; n: string }[]) {
    if (signupMap.has(row.day)) signupMap.set(row.day, Number(row.n));
  }

  return NextResponse.json({
    businesses: {
      total: Number(counts.total),
      active: Number(counts.active),
      suspended: Number(counts.suspended),
    },
    totals: {
      customers: Number(t.customers),
      feedback: Number(t.feedback),
      scans: Number(t.scans),
      reviews: Number(t.reviews),
    },
    signupTrend: Array.from(signupMap.entries()).map(([day, n]) => ({ day, n })),
    topBusinesses: (topBusinesses as { id: number; name: string; slug: string; total_reviews: string }[]).map(
      (b) => ({ id: b.id, name: b.name, slug: b.slug, totalReviews: Number(b.total_reviews) })
    ),
  });
}
