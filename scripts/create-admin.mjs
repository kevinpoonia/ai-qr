// One-off script to create the platform admin account (no UI/API exposes this
// on purpose — it must not be reachable over HTTP). Run with:
//   DATABASE_URL=... node scripts/create-admin.mjs you@example.com 'a-strong-password'
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const cleanEmail = email.trim().toLowerCase();

// Make sure business_id is nullable even if the app server hasn't run its
// lazy schema migration yet.
await sql`ALTER TABLE users ALTER COLUMN business_id DROP NOT NULL`;

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

const existing = await sql`SELECT id, role FROM users WHERE email = ${cleanEmail}`;
if (existing.length > 0) {
  await sql`
    UPDATE users SET password_hash = ${hash}, password_salt = ${salt}, role = 'platform_admin', business_id = NULL
    WHERE email = ${cleanEmail}
  `;
  console.log(`Updated existing user ${cleanEmail} to platform_admin.`);
} else {
  await sql`
    INSERT INTO users (business_id, email, password_hash, password_salt, role)
    VALUES (NULL, ${cleanEmail}, ${hash}, ${salt}, 'platform_admin')
  `;
  console.log(`Created platform_admin user ${cleanEmail}.`);
}
