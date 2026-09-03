import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { renderReviewTemplate } from "@/lib/reviewTemplates";
import { nextReviewIndexForBusiness } from "@/lib/reviewRotation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const business = db
    .prepare("SELECT id, name, location FROM businesses WHERE slug = ?")
    .get(slug) as { id: number; name: string; location: string } | undefined;

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const index = nextReviewIndexForBusiness(business.id);
  const review = renderReviewTemplate(index, business.name, business.location);

  return NextResponse.json({ review, timestamp: new Date().toISOString() });
}
