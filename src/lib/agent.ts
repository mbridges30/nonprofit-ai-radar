import { db } from "./db";
import { useCases, agentRuns } from "./schema";
import { braveSearch, getSearchQueries } from "./search";
import { extractUseCases, scoreUseCase } from "./scorer";
import { eq } from "drizzle-orm";

export async function runResearchAgent(): Promise<{
  runId: number;
  casesFound: number;
}> {
  // Create agent run record
  const run = db
    .insert(agentRuns)
    .values({
      started_at: new Date().toISOString(),
      status: "running",
    })
    .returning()
    .get();

  const runId = run.id;

  try {
    // Get existing titles for deduplication
    const existing = db.select({ title: useCases.title }).from(useCases).all();
    const existingTitles = existing.map((e) => e.title);

    // Phase 1: Search (10 queries, 10 results each)
    const queries = getSearchQueries(10);
    const allResults = [];

    for (const query of queries) {
      try {
        const results = await braveSearch(query, 10);
        allResults.push(...results);
        // Small delay between search calls to be polite to the API
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`Search failed for "${query}":`, err);
      }
    }

    if (allResults.length === 0) {
      db.update(agentRuns)
        .set({
          status: "completed",
          completed_at: new Date().toISOString(),
          cases_found: 0,
        })
        .where(eq(agentRuns.id, runId))
        .run();
      return { runId, casesFound: 0 };
    }

    // Phase 2: Extract use cases in batches of 25 results
    const BATCH_SIZE = 25;
    const extracted = [];
    for (let i = 0; i < allResults.length; i += BATCH_SIZE) {
      const batch = allResults.slice(i, i + BATCH_SIZE);
      try {
        // Re-fetch existing titles each batch to include newly added ones
        const currentExisting = db.select({ title: useCases.title }).from(useCases).all();
        const currentTitles = currentExisting.map((e) => e.title);
        const batchExtracted = await extractUseCases(batch, currentTitles);
        extracted.push(...batchExtracted);
        // Delay between Claude calls
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Extraction failed for batch starting at ${i}:`, err);
      }
    }

    // Phase 3: Score and store each use case
    let casesFound = 0;
    for (const uc of extracted) {
      try {
        const scored = await scoreUseCase(uc);
        db.insert(useCases)
          .values({
            title: scored.title,
            description: scored.description,
            source_url: scored.source_url,
            source_name: scored.source_name,
            category: scored.category,
            tier: scored.tier,
            score: scored.score,
            implementation_notes: scored.implementation_notes,
            example_orgs: JSON.stringify(scored.example_orgs),
            date_found: new Date().toISOString().split("T")[0],
          })
          .run();
        casesFound++;
        // Delay between scoring calls
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`Failed to score/store "${uc.title}":`, err);
      }
    }

    // Update run record
    db.update(agentRuns)
      .set({
        status: "completed",
        completed_at: new Date().toISOString(),
        cases_found: casesFound,
      })
      .where(eq(agentRuns.id, runId))
      .run();

    return { runId, casesFound };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    db.update(agentRuns)
      .set({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: errorMessage,
      })
      .where(eq(agentRuns.id, runId))
      .run();
    throw err;
  }
}
