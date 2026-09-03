import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { listCustomers } from "@/lib/customers";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.businessId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const customers = await listCustomers(session.businessId, q || undefined);

  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.businessId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, phone, email, notes, logReview } = body as Record<string, unknown>;
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim() : "";
  const cleanNotes = typeof notes === "string" ? notes.trim() : "";
  const shouldLogReview = logReview !== false;

  if (!cleanName && !cleanPhone && !cleanEmail) {
    return NextResponse.json(
      { error: "At least a name, phone, or email is required" },
      { status: 400 }
    );
  }

  const sql = await db();

  const existingRows = cleanPhone
    ? await sql`SELECT id FROM customers WHERE business_id = ${session.businessId} AND phone = ${cleanPhone}`
    : [];
  const existing = existingRows[0] as { id: number } | undefined;

  if (existing) {
    const reviewIncrement = shouldLogReview ? 1 : 0;
    const updatedRows = await sql`
      UPDATE customers SET
        name = CASE WHEN ${cleanName} != '' THEN ${cleanName} ELSE name END,
        email = CASE WHEN ${cleanEmail} != '' THEN ${cleanEmail} ELSE email END,
        notes = CASE WHEN ${cleanNotes} != '' THEN ${cleanNotes} ELSE notes END,
        review_count = review_count + ${reviewIncrement},
        last_review_at = CASE WHEN ${shouldLogReview} THEN now() ELSE last_review_at END
      WHERE id = ${existing.id}
      RETURNING *
    `;
    return NextResponse.json({ customer: updatedRows[0], created: false });
  }

  const createdRows = await sql`
    INSERT INTO customers (business_id, name, phone, email, notes, review_count, last_review_at)
    VALUES (
      ${session.businessId}, ${cleanName || null}, ${cleanPhone || null}, ${cleanEmail || null},
      ${cleanNotes || null}, ${shouldLogReview ? 1 : 0}, ${shouldLogReview ? new Date().toISOString() : null}
    )
    RETURNING *
  `;

  return NextResponse.json({ customer: createdRows[0], created: true }, { status: 201 });
}
