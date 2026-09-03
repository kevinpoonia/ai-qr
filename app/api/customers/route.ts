import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Customer } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const db = getDb();

  const rows = q
    ? (db
        .prepare(
          `SELECT * FROM customers
           WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
           ORDER BY created_at DESC`
        )
        .all(`%${q}%`, `%${q}%`, `%${q}%`) as unknown as Customer[])
    : (db.prepare(`SELECT * FROM customers ORDER BY created_at DESC`).all() as unknown as Customer[]);

  return NextResponse.json({ customers: rows });
}

export async function POST(request: Request) {
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

  const db = getDb();

  const existing = cleanPhone
    ? (db.prepare("SELECT id FROM customers WHERE phone = ?").get(cleanPhone) as
        | { id: number }
        | undefined)
    : undefined;

  if (existing) {
    db.prepare(
      `UPDATE customers SET
         name = CASE WHEN ? != '' THEN ? ELSE name END,
         email = CASE WHEN ? != '' THEN ? ELSE email END,
         notes = CASE WHEN ? != '' THEN ? ELSE notes END,
         review_count = review_count + ?,
         last_review_at = CASE WHEN ? THEN datetime('now') ELSE last_review_at END
       WHERE id = ?`
    ).run(
      cleanName,
      cleanName,
      cleanEmail,
      cleanEmail,
      cleanNotes,
      cleanNotes,
      shouldLogReview ? 1 : 0,
      shouldLogReview ? 1 : 0,
      existing.id
    );

    const updated = db.prepare("SELECT * FROM customers WHERE id = ?").get(existing.id);
    return NextResponse.json({ customer: updated, created: false });
  }

  const result = db
    .prepare(
      `INSERT INTO customers (name, phone, email, notes, review_count, last_review_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      cleanName || null,
      cleanPhone || null,
      cleanEmail || null,
      cleanNotes || null,
      shouldLogReview ? 1 : 0,
      shouldLogReview ? new Date().toISOString().slice(0, 19).replace("T", " ") : null
    );

  const created = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(result.lastInsertRowid);

  return NextResponse.json({ customer: created, created: true }, { status: 201 });
}
