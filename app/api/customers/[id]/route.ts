import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Customer } from "@/lib/types";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as
    | Customer
    | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, phone, email, notes } = body as Record<string, unknown>;
  const nextName = typeof name === "string" ? name.trim() : existing.name;
  const nextPhone = typeof phone === "string" ? phone.trim() : existing.phone;
  const nextEmail = typeof email === "string" ? email.trim() : existing.email;
  const nextNotes = typeof notes === "string" ? notes.trim() : existing.notes;

  db.prepare("UPDATE customers SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?").run(
    nextName || null,
    nextPhone || null,
    nextEmail || null,
    nextNotes || null,
    id
  );

  const updated = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  return NextResponse.json({ customer: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("DELETE FROM customers WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
