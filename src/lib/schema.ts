import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const useCases = sqliteTable("use_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  source_url: text("source_url"),
  source_name: text("source_name"),
  category: text("category").notNull(),
  tier: text("tier").notNull(),
  score: integer("score").notNull(),
  implementation_notes: text("implementation_notes"),
  example_orgs: text("example_orgs"),
  date_found: text("date_found").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const agentRuns = sqliteTable("agent_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  started_at: text("started_at").notNull(),
  completed_at: text("completed_at"),
  status: text("status").notNull(),
  cases_found: integer("cases_found").default(0),
  error: text("error"),
});

export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  source_name: text("source_name").notNull(),
  published_at: text("published_at"),
  discovered_at: text("discovered_at").notNull(),
  summary: text("summary"),
  category: text("category").notNull(),
  categories_json: text("categories_json"),
  nonprofit_type: text("nonprofit_type").notNull().default("Cross-Sector"),
  geography: text("geography").notNull().default("Global"),
  relevance_score: integer("relevance_score"),
  tags_json: text("tags_json"),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  confirmed: integer("confirmed").notNull().default(0),
  confirm_token: text("confirm_token"),
  unsubscribe_token: text("unsubscribe_token").notNull(),
  created_at: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const newsAgentRuns = sqliteTable("news_agent_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  started_at: text("started_at").notNull(),
  completed_at: text("completed_at"),
  status: text("status").notNull(),
  articles_found: integer("articles_found").default(0),
  error: text("error"),
});
