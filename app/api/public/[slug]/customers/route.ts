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

  const { name, phone, notes } = body as Record<string, unknown>;
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanNotes = typeof notes === "string" ? notes.trim() : "";

  if (!cleanName && !cleanPhone) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const db = getDb();

  const existing = cleanPhone
    ? (db
        .prepare("SELECT id FROM customers WHERE business_id = ? AND phone = ?")
        .get(businessId, cleanPhone) as { id: number } | undefined)
    : undefined;

  if (existing) {
    db.prepare(
      `UPDATE customers SET
         name = CASE WHEN ? != '' THEN ? ELSE name END,
         notes = CASE WHEN ? != '' THEN ? ELSE notes END,
         review_count = review_count + 1,
         last_review_at = datetime('now')
       WHERE id = ?`
    ).run(cleanName, cleanName, cleanNotes, cleanNotes, existing.id);

    const updated = db.prepare("SELECT * FROM customers WHERE id = ?").get(existing.id);
    return NextResponse.json({ customer: updated, created: false });
  }

  const result = db
    .prepare(
      `INSERT INTO customers (business_id, name, phone, notes, review_count, last_review_at)
       VALUES (?, ?, ?, ?, 1, datetime('now'))`
    )
    .run(businessId, cleanName || null, cleanPhone || null, cleanNotes || null);

  const created = db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ customer: created, created: true }, { status: 201 });
}
