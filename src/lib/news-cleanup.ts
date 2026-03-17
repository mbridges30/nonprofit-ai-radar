import { db } from "./db";
import { newsArticles } from "./schema";
import { sql, lt } from "drizzle-orm";

/**
 * Delete news articles older than `days` days based on discovered_at.
 * Returns the number of deleted rows.
 */
export async function purgeStaleArticles(days: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const result = db
    .delete(newsArticles)
    .where(lt(newsArticles.discovered_at, cutoffStr))
    .run();

  return result.changes;
}
