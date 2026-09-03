import { db } from "./db";
import type { Customer } from "./types";

export async function listCustomers(businessId: number, q?: string): Promise<Customer[]> {
  const sql = await db();

  const rows = q
    ? await sql`
        SELECT * FROM customers
        WHERE business_id = ${businessId}
          AND (name ILIKE ${`%${q}%`} OR phone ILIKE ${`%${q}%`} OR email ILIKE ${`%${q}%`})
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT * FROM customers WHERE business_id = ${businessId} ORDER BY created_at DESC
      `;

  return rows as Customer[];
}
