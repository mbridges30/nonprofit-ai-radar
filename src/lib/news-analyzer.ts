import { callClaude } from "./claude";
import {
  CATEGORIES,
  NONPROFIT_TYPES,
  GEOGRAPHIES,
  type Category,
  type NonprofitType,
  type Geography,
} from "@/types";
import type { RawNewsItem } from "./news-search";

export interface AnalyzedArticle {
  url: string;
  title: string;
  source_name: string;
  published_at: string | null;
  summary: string;
  category: Category;
  all_categories: Category[];
  nonprofit_type: NonprofitType;
  geography: Geography;
  relevance_score: number;
  tags: string[];
}

interface RawClaudeResponse {
  url: string;
  summary: string;
  primary_category: string;
  all_categories: string[];
  nonprofit_type: string;
  geography: string;
  relevance_score: number;
  tags: string[];
}

export async function analyzeArticles(
  articles: RawNewsItem[]
): Promise<AnalyzedArticle[]> {
  if (articles.length === 0) return [];

  const articlesText = articles
    .map(
      (a, i) =>
        `${i + 1}. "${a.title}" [${a.source_name}]\n   ${a.description}\n   URL: ${a.url}`
    )
    .join("\n\n");

  const response = await callClaude(
    [
      {
        role: "user",
        content: `Analyze these news articles about AI in the nonprofit/social sector.

Articles:
${articlesText}

For each article, provide:
- url: The article URL (must match exactly from above)
- summary: A 2-3 sentence summary written for a nonprofit executive. Focus on what matters for their organization.
- primary_category: The single best-fit functional category from: ${CATEGORIES.join(", ")}
- all_categories: Array of all applicable categories from the same list
- nonprofit_type: The type of nonprofit this article is most relevant to, from: ${NONPROFIT_TYPES.join(", ")}. Use "Cross-Sector" if it applies broadly to all nonprofits or doesn't target a specific type.
- geography: The geographic focus of this article, from: ${GEOGRAPHIES.join(", ")}. Use "Global" if it's not region-specific or applies worldwide. Use "North America" for US/Canada stories.
- relevance_score: 1-100 score using this STRICT rubric:
  90-100: A specific nonprofit or NGO is named and described implementing or using AI tools
  70-89: About nonprofit sector AI adoption trends, practical guides for nonprofits adopting AI, or AI tools specifically built for nonprofits
  50-69: General AI news with clear, direct implications for nonprofit operations (e.g., free AI tools nonprofits could use, policy changes affecting nonprofit AI use)
  30-49: Tangentially related — general AI industry news that could eventually affect nonprofits but requires significant interpretation
  1-29: Not relevant to nonprofit AI adoption
- tags: Array of 3-6 tags (tools/products mentioned, organizations, sectors, key concepts)

EXCLUDE entirely (do not include in results):
- Corporate product announcements or white papers that primarily promote a commercial product, unless the product specifically targets nonprofits
- AI company leadership changes, funding rounds, or corporate restructuring
- Stories where "nonprofit" or "charity" is mentioned only in passing (e.g., "tech employee donates to charity")
- Purely technical AI research papers with no practical nonprofit application
- General business AI tools with no nonprofit angle

Return ONLY a valid JSON array.
Example: [{"url": "...", "summary": "...", "primary_category": "...", "all_categories": ["..."], "nonprofit_type": "Health & Human Services", "geography": "North America", "relevance_score": 85, "tags": ["..."]}]`,
      },
    ],
    "You are a nonprofit technology strategist analyzing news about AI in the social sector. Your audience is nonprofit executive directors and technology leaders. Be practical and specific in summaries — avoid hype and focus on what's actionable. Be VERY strict about relevance scoring — only articles that are genuinely useful to nonprofit leaders should score above 50. When in doubt, score lower. Exclude articles that are primarily corporate marketing or only tangentially mention nonprofits."
  );

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);

    return parsed
      .filter(
        (a: RawClaudeResponse) =>
          a.url &&
          a.summary &&
          CATEGORIES.includes(a.primary_category as Category) &&
          (a.relevance_score || 0) >= 40 // Don't store articles below 40
      )
      .map((a: RawClaudeResponse): AnalyzedArticle => {
        const original = articles.find((orig) => orig.url === a.url);
        return {
          url: a.url,
          title: original?.title || a.url,
          source_name: original?.source_name || "Unknown",
          published_at: original?.published_at || null,
          summary: a.summary,
          category: a.primary_category as Category,
          all_categories: (a.all_categories || []).filter((c: string) =>
            CATEGORIES.includes(c as Category)
          ) as Category[],
          nonprofit_type: NONPROFIT_TYPES.includes(a.nonprofit_type as NonprofitType)
            ? (a.nonprofit_type as NonprofitType)
            : "Cross-Sector",
          geography: GEOGRAPHIES.includes(a.geography as Geography)
            ? (a.geography as Geography)
            : "Global",
          relevance_score: Math.max(1, Math.min(100, a.relevance_score || 50)),
          tags: a.tags || [],
        };
      });
  } catch {
    console.error("Failed to parse news analysis response:", response);
    return [];
  }
}
