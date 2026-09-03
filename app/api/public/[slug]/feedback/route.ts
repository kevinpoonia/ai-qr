import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getBusinessIdBySlug } from "@/lib/business";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const businessId = getBusinessIdBySlug(slug);
  if (businessId === null) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { rating, comment, name, phone } = body as Record<string, unknown>;
  const cleanRating = typeof rating === "number" ? Math.round(rating) : NaN;
  if (!Number.isInteger(cleanRating) || cleanRating < 1 || cleanRating > 5) {
    return NextResponse.json({ error: "rating must be an integer from 1 to 5" }, { status: 400 });
  }

  const cleanComment = typeof comment === "string" ? comment.trim() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";

  const db = getDb();

  let customerId: number | null = null;
  if (cleanPhone) {
    const existing = db
      .prepare("SELECT id FROM customers WHERE business_id = ? AND phone = ?")
      .get(businessId, cleanPhone) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE customers SET name = CASE WHEN ? != '' THEN ? ELSE name END WHERE id = ?`
      ).run(cleanName, cleanName, existing.id);
      customerId = existing.id;
    } else {
      const result = db
        .prepare("INSERT INTO customers (business_id, name, phone) VALUES (?, ?, ?)")
        .run(businessId, cleanName || null, cleanPhone);
      customerId = Number(result.lastInsertRowid);
    }
  }

  const result = db
    .prepare(
      "INSERT INTO feedback (business_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)"
    )
    .run(businessId, customerId, cleanRating, cleanComment || null);

  const created = db.prepare("SELECT * FROM feedback WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ feedback: created }, { status: 201 });
}
