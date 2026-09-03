import { db } from "./db";
import type { FeedbackEntry } from "./types";

export async function listFeedback(
  businessId: number,
  status?: string | null
): Promise<FeedbackEntry[]> {
  const sql = await db();

  const rows = status
    ? await sql`
        SELECT f.id, f.customer_id, f.rating, f.comment, f.status, f.created_at,
               c.name AS customer_name, c.phone AS customer_phone
        FROM feedback f
        LEFT JOIN customers c ON c.id = f.customer_id
        WHERE f.business_id = ${businessId} AND f.status = ${status}
        ORDER BY f.created_at DESC
      `
    : await sql`
        SELECT f.id, f.customer_id, f.rating, f.comment, f.status, f.created_at,
               c.name AS customer_name, c.phone AS customer_phone
        FROM feedback f
        LEFT JOIN customers c ON c.id = f.customer_id
        WHERE f.business_id = ${businessId}
        ORDER BY f.created_at DESC
      `;

  return rows as FeedbackEntry[];
}

export async function setFeedbackStatus(
  id: number,
  businessId: number,
  status: "new" | "resolved"
): Promise<FeedbackEntry | undefined> {
  const sql = await db();
  const rows = await sql`
    UPDATE feedback SET status = ${status}
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return rows[0] as FeedbackEntry | undefined;
}

export async function deleteFeedbackEntry(id: number, businessId: number): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    DELETE FROM feedback WHERE id = ${id} AND business_id = ${businessId} RETURNING id
  `;
  return rows.length > 0;
}
