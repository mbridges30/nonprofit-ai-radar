import { db } from "./db";
import { newsArticles, newsAgentRuns } from "./schema";
import { fetchAllNewsSources } from "./news-search";
import { analyzeArticles } from "./news-analyzer";
import { eq } from "drizzle-orm";

export async function runNewsAgent(): Promise<{
  runId: number;
  articlesFound: number;
}> {
  const run = db
    .insert(newsAgentRuns)
    .values({
      started_at: new Date().toISOString(),
      status: "running",
    })
    .returning()
    .get();

  const runId = run.id;

  try {
    // Get existing URLs for deduplication
    const existing = db
      .select({ url: newsArticles.url })
      .from(newsArticles)
      .all();
    const existingUrls = new Set(existing.map((e) => e.url));

    // Phase 1: Fetch from all sources
    console.log("[NewsAgent] Fetching from all news sources...");
    const allItems = await fetchAllNewsSources();
    console.log(`[NewsAgent] Found ${allItems.length} raw items`);

    // Phase 2: Filter out already-known URLs
    const newItems = allItems.filter((item) => !existingUrls.has(item.url));
    console.log(`[NewsAgent] ${newItems.length} new items after dedup`);

    if (newItems.length === 0) {
      db.update(newsAgentRuns)
        .set({
          status: "completed",
          completed_at: new Date().toISOString(),
          articles_found: 0,
        })
        .where(eq(newsAgentRuns.id, runId))
        .run();
      return { runId, articlesFound: 0 };
    }

    // Phase 3: Analyze in batches of 12
    const BATCH_SIZE = 12;
    let articlesFound = 0;

    for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
      const batch = newItems.slice(i, i + BATCH_SIZE);
      try {
        console.log(
          `[NewsAgent] Analyzing batch ${Math.floor(i / BATCH_SIZE) + 1}...`
        );
        const analyzed = await analyzeArticles(batch);

        // Phase 4: Store each analyzed article
        for (const article of analyzed) {
          try {
            db.insert(newsArticles)
              .values({
                title: article.title,
                url: article.url,
                source_name: article.source_name,
                published_at: article.published_at,
                discovered_at: new Date().toISOString(),
                summary: article.summary,
                category: article.category,
                categories_json: JSON.stringify(article.all_categories),
                nonprofit_type: article.nonprofit_type,
                geography: article.geography,
                relevance_score: article.relevance_score,
                tags_json: JSON.stringify(article.tags),
              })
              .run();
            articlesFound++;
          } catch (err) {
            // URL unique constraint will catch any remaining duplicates
            console.error(`Failed to store article "${article.title}":`, err);
          }
        }

        // Delay between Claude calls
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Analysis failed for batch starting at ${i}:`, err);
      }
    }

    // Update run record
    db.update(newsAgentRuns)
      .set({
        status: "completed",
        completed_at: new Date().toISOString(),
        articles_found: articlesFound,
      })
      .where(eq(newsAgentRuns.id, runId))
      .run();

    console.log(
      `[NewsAgent] Completed. Found ${articlesFound} new articles.`
    );
    return { runId, articlesFound };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    db.update(newsAgentRuns)
      .set({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: errorMessage,
      })
      .where(eq(newsAgentRuns.id, runId))
      .run();
    throw err;
  }
}
