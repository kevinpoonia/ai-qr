import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessIdBySlug } from "@/lib/business";

const ALLOWED_TYPES = new Set(["scan", "rating", "review_completed", "feedback_submitted"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const businessId = await getBusinessIdBySlug(slug);
  if (businessId === null) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, rating } = body as Record<string, unknown>;
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const cleanRating =
    typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5
      ? rating
      : null;

  const sql = await db();
  await sql`INSERT INTO events (business_id, type, rating) VALUES (${businessId}, ${type}, ${cleanRating})`;

  return NextResponse.json({ success: true }, { status: 201 });
}
