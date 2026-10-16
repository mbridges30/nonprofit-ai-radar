import { db } from "./db";
import { useCases } from "./schema";
import { callClaude } from "./claude";
import { CATEGORIES, type Category } from "@/types";
import { eq, inArray, sql } from "drizzle-orm";

/** How many use cases to publish per category. */
const DEFAULT_PER_CATEGORY = 6;

interface Selection {
  id: number;
  reason: string;
}

function parseJsonObject<T>(response: string): T {
  try {
    return JSON.parse(response) as T;
  } catch {
    const match = response.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object in response");
    return JSON.parse(match[0]) as T;
  }
}

/**
 * The radar accumulated hundreds of use cases because the weekly agent appended
 * without any editorial gate, and it kept rediscovering the same handful of
 * ideas under different wording ("AI Grant Writing", "AI Writing Tools for
 * Grant Proposals", "AI Content Drafting Assistant"...).
 *
 * This picks a small, genuinely distinct set per category. Everything else is
 * archived — kept in the database, just not plotted.
 */
async function selectForCategory(
  category: Category,
  perCategory: number
): Promise<Selection[]> {
  const rows = db
    .select({
      id: useCases.id,
      title: useCases.title,
      description: useCases.description,
      score: useCases.score,
      tier: useCases.tier,
    })
    .from(useCases)
    .where(eq(useCases.category, category))
    .all();

  if (rows.length === 0) return [];
  if (rows.length <= perCategory) {
    return rows.map((r) => ({ id: r.id, reason: "only candidate in category" }));
  }

  const list = rows
    .map(
      (r) =>
        `ID ${r.id} | score ${r.score} | ${r.tier}\n  ${r.title}\n  ${(
          r.description || ""
        ).slice(0, 220)}`
    )
    .join("\n\n");

  const response = await callClaude(
    [
      {
        role: "user",
        content: `Below are ${rows.length} candidate AI use cases in the category "${category}" from a radar aimed at nonprofit executive directors and boards.

Many of them are near-duplicates of each other, described in different words. Select exactly ${perCategory} to publish.

Selection criteria, in priority order:
1. DISTINCTNESS — no two selections should describe substantially the same activity. "AI grant writing", "AI proposal drafting" and "AI content generation for funders" are ONE idea, not three. This matters more than anything else.
2. CONCRETENESS — prefer use cases a director could picture their own team doing, over vague capability statements.
3. SPREAD — where quality is comparable, prefer a mix across readiness levels (the tiers above) rather than everything at one level.
4. SCORE — use it as a tiebreaker, not the primary filter. A distinct, concrete lower-scored use case beats a redundant high-scoring one.

Candidates:

${list}

Return ONLY a valid JSON object with this exact shape:
{"selections": [{"id": <number>, "reason": "<8 words or fewer on why this one>"}]}
Include exactly ${perCategory} items in the array.`,
      },
    ],
    "You are a nonprofit technology strategist curating a decision-making tool for busy executives. Ruthlessly eliminate redundancy — a short, distinct list is far more useful than a comprehensive one. Always respond with a single JSON object.",
    4096,
    "high"
  );

  const parsed = parseJsonObject<{ selections?: Selection[] }>(response);
  const selections = parsed.selections ?? [];
  if (selections.length === 0) {
    throw new Error(`No selections returned for category "${category}"`);
  }

  const validIds = new Set(rows.map((r) => r.id));
  return selections.filter((s) => validIds.has(s.id));
}

export async function curateRadar(
  opts: { perCategory?: number; dryRun?: boolean } = {}
): Promise<{ published: number; archived: number }> {
  const perCategory = opts.perCategory ?? DEFAULT_PER_CATEGORY;
  const dryRun = opts.dryRun ?? false;

  const chosen: number[] = [];

  for (const category of CATEGORIES) {
    try {
      const selections = await selectForCategory(category, perCategory);
      console.log(`\n${category} — keeping ${selections.length}:`);
      for (const s of selections) {
        const row = db
          .select({ title: useCases.title, score: useCases.score })
          .from(useCases)
          .where(eq(useCases.id, s.id))
          .get();
        console.log(`  [${row?.score}] ${row?.title}  — ${s.reason}`);
      }
      chosen.push(...selections.map((s) => s.id));
    } catch (err) {
      console.error(`Curation failed for "${category}":`, err);
    }
  }

  const total = db
    .select({ c: sql<number>`count(*)` })
    .from(useCases)
    .get();
  const totalCount = total?.c ?? 0;

  if (dryRun) {
    console.log(
      `\n[dry run] would publish ${chosen.length}, archive ${totalCount - chosen.length}`
    );
    return { published: chosen.length, archived: totalCount - chosen.length };
  }

  if (chosen.length === 0) {
    throw new Error("Curation selected nothing — refusing to archive the radar");
  }

  db.update(useCases).set({ status: "archived" }).run();
  db.update(useCases)
    .set({ status: "published" })
    .where(inArray(useCases.id, chosen))
    .run();

  console.log(
    `\nPublished ${chosen.length}, archived ${totalCount - chosen.length}.`
  );
  return { published: chosen.length, archived: totalCount - chosen.length };
}
