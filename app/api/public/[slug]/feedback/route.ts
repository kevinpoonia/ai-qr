import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBusinessIdBySlug } from "@/lib/business";

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

  const { rating, comment, name, phone } = body as Record<string, unknown>;
  const cleanRating = typeof rating === "number" ? Math.round(rating) : NaN;
  if (!Number.isInteger(cleanRating) || cleanRating < 1 || cleanRating > 5) {
    return NextResponse.json({ error: "rating must be an integer from 1 to 5" }, { status: 400 });
  }

  const cleanComment = typeof comment === "string" ? comment.trim() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";

  const sql = await db();

  let customerId: number | null = null;
  if (cleanPhone) {
    const existingRows = await sql`
      SELECT id FROM customers WHERE business_id = ${businessId} AND phone = ${cleanPhone}
    `;
    const existing = existingRows[0] as { id: number } | undefined;

    if (existing) {
      await sql`
        UPDATE customers SET name = CASE WHEN ${cleanName} != '' THEN ${cleanName} ELSE name END
        WHERE id = ${existing.id}
      `;
      customerId = existing.id;
    } else {
      const createdRows = await sql`
        INSERT INTO customers (business_id, name, phone) VALUES (${businessId}, ${cleanName || null}, ${cleanPhone})
        RETURNING id
      `;
      customerId = Number((createdRows[0] as { id: number }).id);
    }
  }

  const feedbackRows = await sql`
    INSERT INTO feedback (business_id, customer_id, rating, comment)
    VALUES (${businessId}, ${customerId}, ${cleanRating}, ${cleanComment || null})
    RETURNING *
  `;

  return NextResponse.json({ feedback: feedbackRows[0] }, { status: 201 });
}
