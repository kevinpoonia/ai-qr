import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import type { Role } from "./types";

interface UserRow {
  id: number;
  business_id: number;
  email: string;
  password_hash: string;
  password_salt: string;
  role: Role;
  created_at: string;
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return base || "business";
}

async function generateUniqueSlug(base: string): Promise<string> {
  const sql = await db();
  let candidate = base;
  for (let attempt = 0; attempt < 10; attempt++) {
    const rows = await sql`SELECT id FROM businesses WHERE slug = ${candidate}`;
    if (rows.length === 0) return candidate;
    candidate = `${base}-${randomBytes(2).toString("hex")}`;
  }
  throw new Error("Could not generate a unique slug");
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const sql = await db();
  const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
  return rows[0] as UserRow | undefined;
}

export function verifyUserPassword(user: UserRow, password: string): boolean {
  return verifyPassword(password, user.password_hash, user.password_salt);
}

export async function setUserPassword(userId: number, password: string): Promise<void> {
  const { hash, salt } = hashPassword(password);
  const sql = await db();
  await sql`UPDATE users SET password_hash = ${hash}, password_salt = ${salt} WHERE id = ${userId}`;
}

export async function createBusinessWithOwner(
  businessName: string,
  email: string,
  password: string,
  location: string = ""
): Promise<{ businessId: number; userId: number; slug: string }> {
  const sql = await db();
  const slug = await generateUniqueSlug(slugify(businessName));

  const bizRows = await sql`
    INSERT INTO businesses (name, slug, location) VALUES (${businessName}, ${slug}, ${location})
    RETURNING id
  `;
  const businessId = Number((bizRows[0] as { id: number }).id);

  const { hash, salt } = hashPassword(password);
  const userRows = await sql`
    INSERT INTO users (business_id, email, password_hash, password_salt, role)
    VALUES (${businessId}, ${email.toLowerCase()}, ${hash}, ${salt}, 'owner')
    RETURNING id
  `;

  return { businessId, userId: Number((userRows[0] as { id: number }).id), slug };
}

export async function createStaffUser(
  businessId: number,
  email: string,
  password: string
): Promise<{ userId: number }> {
  const { hash, salt } = hashPassword(password);
  const sql = await db();
  const rows = await sql`
    INSERT INTO users (business_id, email, password_hash, password_salt, role)
    VALUES (${businessId}, ${email.toLowerCase()}, ${hash}, ${salt}, 'staff')
    RETURNING id
  `;
  return { userId: Number((rows[0] as { id: number }).id) };
}
