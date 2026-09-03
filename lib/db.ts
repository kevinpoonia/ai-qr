import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "app.db");

declare global {
  var __aiQrDb: DatabaseSync | undefined;
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
  `);

  const existing = db.prepare("SELECT id FROM settings WHERE id = 1").get();
  if (!existing) {
    db.prepare(
      "INSERT INTO settings (id, business_name, google_reviews_url) VALUES (1, ?, ?)"
    ).run(
      "My Business",
      "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG8391Ic"
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
