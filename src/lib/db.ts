import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "radar.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// Initialize tables on first import
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS use_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    source_url TEXT,
    source_name TEXT,
    category TEXT NOT NULL,
    tier TEXT NOT NULL,
    score INTEGER NOT NULL,
    implementation_notes TEXT,
    example_orgs TEXT,
    date_found TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    cases_found INTEGER DEFAULT 0,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,
    published_at TEXT,
    discovered_at TEXT NOT NULL,
    summary TEXT,
    category TEXT NOT NULL,
    categories_json TEXT,
    relevance_score INTEGER,
    tags_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news_agent_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL,
    articles_found INTEGER DEFAULT 0,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    confirmed INTEGER NOT NULL DEFAULT 0,
    confirm_token TEXT,
    unsubscribe_token TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add new columns to existing news_articles table (safe to run repeatedly)
try {
  sqlite.exec(`ALTER TABLE news_articles ADD COLUMN nonprofit_type TEXT NOT NULL DEFAULT 'Cross-Sector'`);
} catch { /* column already exists */ }
try {
  sqlite.exec(`ALTER TABLE news_articles ADD COLUMN geography TEXT NOT NULL DEFAULT 'Global'`);
} catch { /* column already exists */ }

// One-time migration: clean up existing articles with HTML in titles or Google redirect URLs
(() => {
  const rows = sqlite
    .prepare(
      `SELECT id, title, url, source_name FROM news_articles
       WHERE title LIKE '%<%>%' OR url LIKE '%google.com/url%' OR title LIKE 'http%'`
    )
    .all() as { id: number; title: string; url: string; source_name: string }[];

  if (rows.length === 0) return;

  const update = sqlite.prepare(
    `UPDATE news_articles SET title = ?, url = ?, source_name = ? WHERE id = ?`
  );
  const deleteRow = sqlite.prepare(`DELETE FROM news_articles WHERE id = ?`);
  const existingUrl = sqlite.prepare(`SELECT id FROM news_articles WHERE url = ? AND id != ?`);

  const txn = sqlite.transaction(() => {
    for (const row of rows) {
      let url = row.url;
      // Unwrap Google redirect
      if (url.includes("google.com/url")) {
        try {
          const parsed = new URL(url);
          const realUrl = parsed.searchParams.get("url");
          if (realUrl) url = realUrl;
        } catch { /* keep original */ }
      }

      // If the unwrapped URL already exists as another article, delete this duplicate
      if (url !== row.url) {
        const existing = existingUrl.get(url, row.id) as { id: number } | undefined;
        if (existing) {
          deleteRow.run(row.id);
          continue;
        }
      }

      // Strip HTML from title
      let title = row.title.replace(/<[^>]*>/g, "").trim();

      // If title is a URL, generate readable slug
      if (title.startsWith("http") || title.startsWith("www.") || !title) {
        try {
          const parsed = new URL(url);
          const slug = parsed.pathname.split("/").filter(Boolean).pop() || "";
          title = slug
            .replace(/[-_]/g, " ")
            .replace(/\.\w+$/, "")
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
            .trim();
          if (!title) title = parsed.hostname.replace(/^www\./, "");
        } catch {
          title = row.title;
        }
      }

      // Fix source name
      let sourceName = row.source_name;
      if (sourceName === "Google Alerts" || sourceName === "Unknown") {
        try {
          sourceName = new URL(url).hostname.replace(/^www\./, "");
        } catch { /* keep original */ }
      }

      update.run(title, url, sourceName, row.id);
    }
  });

  txn();
  console.log(`[DB Migration] Cleaned up ${rows.length} articles with HTML/redirect URLs`);
})()
