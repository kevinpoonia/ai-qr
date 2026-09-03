import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    cached = neon(url);
  }
  return cached;
}

async function ensureSchema(sql: NeonQueryFunction<false, false>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL DEFAULT '',
      google_reviews_url TEXT NOT NULL DEFAULT '',
      feedback_mode TEXT NOT NULL DEFAULT 'gated',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      review_count INTEGER NOT NULL DEFAULT 0,
      last_review_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_business_phone
      ON customers(business_id, phone) WHERE phone IS NOT NULL AND phone <> ''
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      rating INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_events_business_type_created
      ON events(business_id, type, created_at)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS review_rotations (
      business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      step INTEGER NOT NULL,
      offset_val INTEGER NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0
    )
  `;
}

// Lazily runs schema setup once per server instance, then hands back the
// query function. Every CREATE is IF NOT EXISTS, so this is safe to race
// across concurrent cold starts.
export async function db(): Promise<NeonQueryFunction<false, false>> {
  const sql = getSql();
  if (!schemaReady) {
    schemaReady = ensureSchema(sql);
  }
  await schemaReady;
  return sql;
}
