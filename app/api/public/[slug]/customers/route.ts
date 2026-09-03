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

  const { name, phone, notes } = body as Record<string, unknown>;
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanNotes = typeof notes === "string" ? notes.trim() : "";

  if (!cleanName && !cleanPhone) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const sql = await db();

  const existingRows = cleanPhone
    ? await sql`SELECT id FROM customers WHERE business_id = ${businessId} AND phone = ${cleanPhone}`
    : [];
  const existing = existingRows[0] as { id: number } | undefined;

  if (existing) {
    const updatedRows = await sql`
      UPDATE customers SET
        name = CASE WHEN ${cleanName} != '' THEN ${cleanName} ELSE name END,
        notes = CASE WHEN ${cleanNotes} != '' THEN ${cleanNotes} ELSE notes END,
        review_count = review_count + 1,
        last_review_at = now()
      WHERE id = ${existing.id}
      RETURNING *
    `;
    return NextResponse.json({ customer: updatedRows[0], created: false });
  }

  const createdRows = await sql`
    INSERT INTO customers (business_id, name, phone, notes, review_count, last_review_at)
    VALUES (${businessId}, ${cleanName || null}, ${cleanPhone || null}, ${cleanNotes || null}, 1, now())
    RETURNING *
  `;

  return NextResponse.json({ customer: createdRows[0], created: true }, { status: 201 });
}
