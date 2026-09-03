import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

export async function GET(request: Request) {
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sql = await db();

  const rows = status
    ? await sql`
        SELECT f.id, f.customer_id, f.rating, f.comment, f.status, f.created_at,
               c.name AS customer_name, c.phone AS customer_phone
        FROM feedback f
        LEFT JOIN customers c ON c.id = f.customer_id
        WHERE f.business_id = ${session.businessId} AND f.status = ${status}
        ORDER BY f.created_at DESC
      `
    : await sql`
        SELECT f.id, f.customer_id, f.rating, f.comment, f.status, f.created_at,
               c.name AS customer_name, c.phone AS customer_phone
        FROM feedback f
        LEFT JOIN customers c ON c.id = f.customer_id
        WHERE f.business_id = ${session.businessId}
        ORDER BY f.created_at DESC
      `;

  return NextResponse.json({ feedback: rows });
}
