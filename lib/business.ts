import { db } from "./db";

export async function getBusinessIdBySlug(slug: string): Promise<number | null> {
  const sql = await db();
  const rows = await sql`SELECT id FROM businesses WHERE slug = ${slug}`;
  const row = rows[0] as { id: number } | undefined;
  return row?.id ?? null;
}
