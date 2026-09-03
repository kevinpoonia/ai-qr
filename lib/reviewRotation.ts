import { getDb } from "./db";
import { TOTAL_REVIEW_TEMPLATES } from "./reviewTemplates";

function shuffledIndices(): number[] {
  const arr = Array.from({ length: TOTAL_REVIEW_TEMPLATES }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Hands out the next template index for a business from a shuffled, persisted
// rotation so no two consecutive (or concurrent) requests get the same
// review — every one of the 1000 templates is used exactly once before any
// repeat. node:sqlite's synchronous API means this read-modify-write has no
// await in between, so it can't race across concurrent requests in one process.
export function nextReviewIndexForBusiness(businessId: number): number {
  const db = getDb();
  const row = db
    .prepare("SELECT order_json, cursor FROM review_rotations WHERE business_id = ?")
    .get(businessId) as { order_json: string; cursor: number } | undefined;

  const order: number[] = row ? JSON.parse(row.order_json) : shuffledIndices();
  const cursor = row ? row.cursor : 0;

  const index = order[cursor];
  const atEnd = cursor + 1 >= order.length;
  const nextOrder = atEnd ? shuffledIndices() : order;
  const nextCursor = atEnd ? 0 : cursor + 1;

  db.prepare(
    `INSERT INTO review_rotations (business_id, order_json, cursor) VALUES (?, ?, ?)
     ON CONFLICT(business_id) DO UPDATE SET order_json = excluded.order_json, cursor = excluded.cursor`
  ).run(businessId, JSON.stringify(nextOrder), nextCursor);

  return index;
}
