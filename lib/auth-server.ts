import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";
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

function generateUniqueSlug(base: string): string {
  const db = getDb();
  let candidate = base;
  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = db.prepare("SELECT id FROM businesses WHERE slug = ?").get(candidate);
    if (!existing) return candidate;
    candidate = `${base}-${randomBytes(2).toString("hex")}`;
  }
  throw new Error("Could not generate a unique slug");
}

export function findUserByEmail(email: string): UserRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as
    | UserRow
    | undefined;
}

export function verifyUserPassword(user: UserRow, password: string): boolean {
  return verifyPassword(password, user.password_hash, user.password_salt);
}

export function setUserPassword(userId: number, password: string): void {
  const { hash, salt } = hashPassword(password);
  getDb()
    .prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?")
    .run(hash, salt, userId);
}

export function createBusinessWithOwner(
  businessName: string,
  email: string,
  password: string
): { businessId: number; userId: number; slug: string } {
  const db = getDb();
  const slug = generateUniqueSlug(slugify(businessName));

  const bizResult = db
    .prepare("INSERT INTO businesses (name, slug) VALUES (?, ?)")
    .run(businessName, slug);
  const businessId = Number(bizResult.lastInsertRowid);

  const { hash, salt } = hashPassword(password);
  const userResult = db
    .prepare(
      "INSERT INTO users (business_id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'owner')"
    )
    .run(businessId, email.toLowerCase(), hash, salt);

  return { businessId, userId: Number(userResult.lastInsertRowid), slug };
}

export function createStaffUser(
  businessId: number,
  email: string,
  password: string
): { userId: number } {
  const { hash, salt } = hashPassword(password);
  const result = getDb()
    .prepare(
      "INSERT INTO users (business_id, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, 'staff')"
    )
    .run(businessId, email.toLowerCase(), hash, salt);
  return { userId: Number(result.lastInsertRowid) };
}
