import { getDb } from "./db";

export function getBusinessIdBySlug(slug: string): number | null {
  const db = getDb();
  const row = db.prepare("SELECT id FROM businesses WHERE slug = ?").get(slug) as
    | { id: number }
    | undefined;
  return row?.id ?? null;
}
