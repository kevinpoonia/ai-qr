import { db } from "./db";

export interface AuditLogEntry {
  id: number;
  action: string;
  detail: string | null;
  created_at: string;
  admin_email: string;
  business_name: string | null;
}

export async function logAdminAction(
  adminUserId: number,
  action: string,
  businessId: number | null,
  detail: string | null = null
): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO admin_audit_log (admin_user_id, action, business_id, detail)
    VALUES (${adminUserId}, ${action}, ${businessId}, ${detail})
  `;
}

export async function listRecentActivity(limit: number = 20): Promise<AuditLogEntry[]> {
  const sql = await db();
  const rows = await sql`
    SELECT a.id, a.action, a.detail, a.created_at,
           u.email AS admin_email,
           b.name AS business_name
    FROM admin_audit_log a
    JOIN users u ON u.id = a.admin_user_id
    LEFT JOIN businesses b ON b.id = a.business_id
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
  return rows as AuditLogEntry[];
}
