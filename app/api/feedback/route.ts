import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/session";
import { listFeedback } from "@/lib/feedback";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session || session.businessId === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const feedback = await listFeedback(session.businessId, status);

  return NextResponse.json({ feedback });
}
