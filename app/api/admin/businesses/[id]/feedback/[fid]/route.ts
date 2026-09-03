import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { deleteFeedbackEntry, setFeedbackStatus } from "@/lib/feedback";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fid: string }> }
) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam, fid: fidParam } = await params;
  const businessId = parseId(idParam);
  const feedbackId = parseId(fidParam);
  if (businessId === null || feedbackId === null) {
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

  const feedback = await setFeedbackStatus(feedbackId, businessId, status);
  if (!feedback) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ feedback });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fid: string }> }
) {
  const session = getSessionContext(request);
  if (!session || session.role !== "platform_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam, fid: fidParam } = await params;
  const businessId = parseId(idParam);
  const feedbackId = parseId(fidParam);
  if (businessId === null || feedbackId === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const deleted = await deleteFeedbackEntry(feedbackId, businessId);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
