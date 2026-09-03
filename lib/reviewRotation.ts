import { db } from "./db";
import { TOTAL_REVIEW_TEMPLATES } from "./reviewTemplates";

// Numbers coprime with 1000 (2^3 * 5^3): any number not divisible by 2 or 5.
// Stepping through 0..999 by such a step visits every value exactly once
// before repeating — a full-period permutation with no table to store.
const COPRIME_STEPS = Array.from({ length: 500 }, (_, i) => i * 2 + 1).filter(
  (n) => n % 5 !== 0
);

function randomStep(): number {
  return COPRIME_STEPS[Math.floor(Math.random() * COPRIME_STEPS.length)];
}

function randomOffset(): number {
  return Math.floor(Math.random() * TOTAL_REVIEW_TEMPLATES);
}

// Hands out the next template index for a business. The insert-or-increment
// happens as one atomic UPSERT, so Postgres's row-level locking serializes
// concurrent requests for the same business — no two callers can ever get
// back the same counter value, and therefore never the same review, until a
// full 1000-review cycle completes.
export async function nextReviewIndexForBusiness(businessId: number): Promise<number> {
  const sql = await db();
  const step = randomStep();
  const offset = randomOffset();

  const rows = await sql`
    INSERT INTO review_rotations (business_id, step, offset_val, counter)
    VALUES (${businessId}, ${step}, ${offset}, 0)
    ON CONFLICT (business_id) DO UPDATE SET counter = review_rotations.counter + 1
    RETURNING step, offset_val, counter
  `;

  const row = rows[0] as { step: number; offset_val: number; counter: number | string };
  const counter = Number(row.counter);

  return (row.offset_val + counter * row.step) % TOTAL_REVIEW_TEMPLATES;
}
