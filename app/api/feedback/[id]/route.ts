import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

  const { status } = body as Record<string, unknown>;
  if (status !== "new" && status !== "resolved") {
    return NextResponse.json({ error: "status must be 'new' or 'resolved'" }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare("UPDATE feedback SET status = ? WHERE id = ?").run(status, id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = db.prepare("SELECT * FROM feedback WHERE id = ?").get(id);
  return NextResponse.json({ feedback: updated });
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
  const result = db.prepare("DELETE FROM feedback WHERE id = ?").run(id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
