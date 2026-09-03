import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTemplatePoolSize, renderReviewTemplate } from "@/lib/reviewTemplates";
import { nextReviewIndexForBusiness } from "@/lib/reviewRotation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sql = await db();
  const rows = await sql`SELECT id, name, location, category FROM businesses WHERE slug = ${slug}`;
  const business = rows[0] as
    | { id: number; name: string; location: string; category: string }
    | undefined;

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const total = getTemplatePoolSize(business.category);
  const index = await nextReviewIndexForBusiness(business.id, total);
  const review = renderReviewTemplate(index, business.name, business.location, business.category);

  return NextResponse.json({ review, timestamp: new Date().toISOString() });
}
