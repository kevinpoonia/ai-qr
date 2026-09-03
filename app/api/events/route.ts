import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const ALLOWED_TYPES = new Set(["scan", "rating", "review_completed", "feedback_submitted"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, rating } = body as Record<string, unknown>;
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const cleanRating =
    typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5
      ? rating
      : null;

  const db = getDb();
  db.prepare("INSERT INTO events (type, rating) VALUES (?, ?)").run(type, cleanRating);

  return NextResponse.json({ success: true }, { status: 201 });
}
