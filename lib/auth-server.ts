import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";

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

export function verifyAdminPassword(password: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT admin_password_hash, admin_password_salt FROM settings WHERE id = 1")
    .get() as { admin_password_hash: string | null; admin_password_salt: string | null } | undefined;

  if (!row?.admin_password_hash || !row?.admin_password_salt) return false;
  return verifyPassword(password, row.admin_password_hash, row.admin_password_salt);
}

export function setAdminPassword(password: string): void {
  const { hash, salt } = hashPassword(password);
  const db = getDb();
  db.prepare("UPDATE settings SET admin_password_hash = ?, admin_password_salt = ? WHERE id = 1").run(
    hash,
    salt
  );
}
