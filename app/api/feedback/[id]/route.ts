import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

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

  const { status } = body as Record<string, unknown>;
  if (status !== "new" && status !== "resolved") {
    return NextResponse.json({ error: "status must be 'new' or 'resolved'" }, { status: 400 });
  }

  const sql = await db();
  const updatedRows = await sql`
    UPDATE feedback SET status = ${status}
    WHERE id = ${id} AND business_id = ${session.businessId}
    RETURNING *
  `;

  if (updatedRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ feedback: updatedRows[0] });
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
    DELETE FROM feedback WHERE id = ${id} AND business_id = ${session.businessId} RETURNING id
  `;

  if (deletedRows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
