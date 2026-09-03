import { db } from "./db";

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// Coprime steps depend on the pool size, which now varies by business
// category, so they're computed per-total and cached rather than hardcoded.
const coprimeStepsCache = new Map<number, number[]>();

function getCoprimeSteps(total: number): number[] {
  let steps = coprimeStepsCache.get(total);
  if (!steps) {
    steps = Array.from({ length: total - 1 }, (_, i) => i + 1).filter(
      (n) => gcd(n, total) === 1
    );
    coprimeStepsCache.set(total, steps);
  }
  return steps;
}

// Hands out the next template index for a business, out of `total` possible
// templates for that business's category. The insert-or-increment happens as
// one atomic UPSERT, so Postgres's row-level locking serializes concurrent
// requests for the same business — no two callers can ever get back the same
// counter value, and therefore never the same review, until a full cycle
// through every template completes. Stepping through 0..total-1 by a step
// coprime with total visits every value exactly once before repeating.
export async function nextReviewIndexForBusiness(
  businessId: number,
  total: number
): Promise<number> {
  const sql = await db();
  const steps = getCoprimeSteps(total);
  const step = steps[Math.floor(Math.random() * steps.length)];
  const offset = Math.floor(Math.random() * total);

  const rows = await sql`
    INSERT INTO review_rotations (business_id, step, offset_val, counter)
    VALUES (${businessId}, ${step}, ${offset}, 0)
    ON CONFLICT (business_id) DO UPDATE SET counter = review_rotations.counter + 1
    RETURNING step, offset_val, counter
  `;

  const row = rows[0] as { step: number; offset_val: number; counter: number | string };
  const counter = Number(row.counter);

  return (row.offset_val + counter * row.step) % total;
}
