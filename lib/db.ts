import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");
const DEFAULT_ADMIN_PASSWORD = "admin123";

declare global {
  var __aiQrDb: DatabaseSync | undefined;
}

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function createDb(): DatabaseSync {
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL DEFAULT 'My Business',
      google_reviews_url TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      review_count INTEGER NOT NULL DEFAULT 0,
      last_review_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL AND phone != '';

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      rating INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(type, created_at);
  `);

  ensureColumn(db, "settings", "feedback_mode", "TEXT NOT NULL DEFAULT 'gated'");
  ensureColumn(db, "settings", "admin_password_hash", "TEXT");
  ensureColumn(db, "settings", "admin_password_salt", "TEXT");

  const existing = db.prepare("SELECT id, admin_password_hash FROM settings WHERE id = 1").get() as
    | { id: number; admin_password_hash: string | null }
    | undefined;

  if (!existing) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString("hex");
    db.prepare(
      `INSERT INTO settings (id, business_name, google_reviews_url, feedback_mode, admin_password_hash, admin_password_salt)
       VALUES (1, ?, ?, 'gated', ?, ?)`
    ).run(
      "My Business",
      "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG8391Ic",
      hash,
      salt
    );
    console.warn(
      `\n⚠️  AI QR System: no admin account found — created one with the default password "${DEFAULT_ADMIN_PASSWORD}".\n   Log in and change it immediately from the Settings page.\n`
    );
  } else if (!existing.admin_password_hash) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(DEFAULT_ADMIN_PASSWORD, salt, 64).toString("hex");
    db.prepare("UPDATE settings SET admin_password_hash = ?, admin_password_salt = ? WHERE id = 1").run(
      hash,
      salt
    );
    console.warn(
      `\n⚠️  AI QR System: no admin password was set — set it to the default "${DEFAULT_ADMIN_PASSWORD}".\n   Log in and change it immediately from the Settings page.\n`
    );
  }

  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__aiQrDb) {
    globalThis.__aiQrDb = createDb();
  }
  return globalThis.__aiQrDb;
}
