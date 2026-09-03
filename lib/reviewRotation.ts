import { db } from "./db";
import { TOTAL_REVIEW_TEMPLATES } from "./reviewTemplates";

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// Every step coprime with TOTAL_REVIEW_TEMPLATES. Stepping through 0..total-1
// by such a step visits every value exactly once before repeating — a
// full-period permutation with no table to store. Computed generically (not
// hardcoded to a specific total) so the template pool sizes can change freely.
const COPRIME_STEPS = Array.from({ length: TOTAL_REVIEW_TEMPLATES - 1 }, (_, i) => i + 1).filter(
  (n) => gcd(n, TOTAL_REVIEW_TEMPLATES) === 1
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
// full cycle through every template completes.
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
