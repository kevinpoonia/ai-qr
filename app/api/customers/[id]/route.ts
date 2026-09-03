import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import type { Customer } from "@/lib/types";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const sql = await db();
  const existingRows = await sql`
    SELECT * FROM customers WHERE id = ${id} AND business_id = ${session.businessId}
  `;
  const existing = existingRows[0] as Customer | undefined;

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, phone, email, notes } = body as Record<string, unknown>;
  const nextName = typeof name === "string" ? name.trim() : existing.name;
  const nextPhone = typeof phone === "string" ? phone.trim() : existing.phone;
  const nextEmail = typeof email === "string" ? email.trim() : existing.email;
  const nextNotes = typeof notes === "string" ? notes.trim() : existing.notes;

  const updatedRows = await sql`
    UPDATE customers SET name = ${nextName || null}, phone = ${nextPhone || null},
      email = ${nextEmail || null}, notes = ${nextNotes || null}
    WHERE id = ${id} AND business_id = ${session.businessId}
    RETURNING *
  `;

  return NextResponse.json({ customer: updatedRows[0] });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const sql = await db();
  const deletedRows = await sql`
    DELETE FROM customers WHERE id = ${id} AND business_id = ${session.businessId} RETURNING id
  `;

  if (deletedRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
