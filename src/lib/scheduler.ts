import cron from "node-cron";

let scheduled = false;

export function startScheduler() {
  if (scheduled) return;
  scheduled = true;

  // Run every Sunday at 2:00 AM
  cron.schedule("0 2 * * 0", async () => {
    console.log("[Scheduler] Running weekly research agent...");
    try {
      const { runResearchAgent } = await import("./agent");
      const result = await runResearchAgent();
      console.log(
        `[Scheduler] Agent completed. Found ${result.casesFound} new use cases. Run ID: ${result.runId}`
      );
    } catch (err) {
      console.error("[Scheduler] Agent failed:", err);
    }
  });

  console.log("[Scheduler] Weekly research agent scheduled (Sundays 2:00 AM)");

  // Run every day at 6:00 AM — news collection
  cron.schedule("0 6 * * *", async () => {
    console.log("[Scheduler] Running daily news agent...");
    try {
      const { runNewsAgent } = await import("./news-agent");
      const result = await runNewsAgent();
      console.log(
        `[Scheduler] News agent completed. Found ${result.articlesFound} new articles. Run ID: ${result.runId}`
      );
    } catch (err) {
      console.error("[Scheduler] News agent failed:", err);
    }
  });

  console.log("[Scheduler] Daily news agent scheduled (6:00 AM)");

  // Run every day at 3:00 AM — purge articles older than 90 days
  cron.schedule("0 3 * * *", async () => {
    console.log("[Scheduler] Running stale article cleanup...");
    try {
      const { purgeStaleArticles } = await import("./news-cleanup");
      const deleted = await purgeStaleArticles(90);
      console.log(`[Scheduler] Cleanup complete. Removed ${deleted} stale articles.`);
    } catch (err) {
      console.error("[Scheduler] Cleanup failed:", err);
    }
  });

  console.log("[Scheduler] Daily stale article cleanup scheduled (3:00 AM)");

  // Send weekly email digest every Monday at 8:00 AM
  cron.schedule("0 8 * * 1", async () => {
    console.log("[Scheduler] Sending weekly email digest...");
    try {
      const { sendWeeklyDigest } = await import("./email-digest");
      const result = await sendWeeklyDigest();
      console.log(
        `[Scheduler] Digest sent to ${result.sent} subscribers (${result.articles} articles).`
      );
    } catch (err) {
      console.error("[Scheduler] Digest failed:", err);
    }
  });

  console.log("[Scheduler] Weekly email digest scheduled (Mondays 8:00 AM)");
}
