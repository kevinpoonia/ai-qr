import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const db = getDb();

  const query = `
    SELECT f.id, f.customer_id, f.rating, f.comment, f.status, f.created_at,
           c.name AS customer_name, c.phone AS customer_phone
    FROM feedback f
    LEFT JOIN customers c ON c.id = f.customer_id
    ${status ? "WHERE f.status = ?" : ""}
    ORDER BY f.created_at DESC
  `;

  const rows = status ? db.prepare(query).all(status) : db.prepare(query).all();
  return NextResponse.json({ feedback: rows });
}

export async function POST(request: Request) {
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
    const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(cleanPhone) as
      | { id: number }
      | undefined;

    if (existing) {
      db.prepare(
        `UPDATE customers SET name = CASE WHEN ? != '' THEN ? ELSE name END WHERE id = ?`
      ).run(cleanName, cleanName, existing.id);
      customerId = existing.id;
    } else {
      const result = db
        .prepare("INSERT INTO customers (name, phone) VALUES (?, ?)")
        .run(cleanName || null, cleanPhone);
      customerId = Number(result.lastInsertRowid);
    }
  }

  const result = db
    .prepare("INSERT INTO feedback (customer_id, rating, comment) VALUES (?, ?, ?)")
    .run(customerId, cleanRating, cleanComment || null);

  const created = db.prepare("SELECT * FROM feedback WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json({ feedback: created }, { status: 201 });
}
