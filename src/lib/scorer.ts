import { callClaude } from "./claude";
import { CATEGORIES, type Category, type Tier } from "@/types";

interface ExtractedUseCase {
  title: string;
  description: string;
  source_url: string;
  source_name: string;
  category: Category;
}

interface ScoredUseCase extends ExtractedUseCase {
  tier: Tier;
  score: number;
  implementation_notes: string;
  example_orgs: string[];
}

export async function extractUseCases(
  searchResults: { title: string; url: string; description: string }[],
  existingTitles: string[]
): Promise<ExtractedUseCase[]> {
  const resultsText = searchResults
    .map((r, i) => `${i + 1}. "${r.title}" - ${r.description}\n   URL: ${r.url}`)
    .join("\n");

  const existingText =
    existingTitles.length > 0
      ? `\n\nAlready in database (do NOT duplicate these):\n${existingTitles.map((t) => `- ${t}`).join("\n")}`
      : "";

  const response = await callClaude(
    [
      {
        role: "user",
        content: `Analyze these search results and extract distinct AI use cases for the nonprofit sector.

Search Results:
${resultsText}
${existingText}

For each NEW and DISTINCT use case, provide:
- title: A clear, concise title (max 10 words)
- description: 2-3 sentences explaining the use case and its value for nonprofits
- source_url: The URL where this was found
- source_name: The publication or website name
- category: One of: ${CATEGORIES.join(", ")}

Return ONLY valid JSON array. If no new use cases found, return [].
Example: [{"title": "...", "description": "...", "source_url": "...", "source_name": "...", "category": "..."}]`,
      },
    ],
    "You are an AI research analyst specializing in nonprofit technology. Extract concrete, actionable AI use cases from search results. Focus on real applications, not theoretical concepts. Be specific about what the AI does and how it helps nonprofits."
  );

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.filter(
      (uc: ExtractedUseCase) =>
        uc.title &&
        uc.description &&
        CATEGORIES.includes(uc.category as Category)
    );
  } catch {
    console.error("Failed to parse extraction response:", response);
    return [];
  }
}

export async function scoreUseCase(
  useCase: ExtractedUseCase
): Promise<ScoredUseCase> {
  const response = await callClaude(
    [
      {
        role: "user",
        content: `Score this nonprofit AI use case on implementation readiness:

Title: ${useCase.title}
Description: ${useCase.description}
Category: ${useCase.category}

Score from 1-100 based on:
- Tool availability (are off-the-shelf tools available?)
- Cost (can a small nonprofit afford it?)
- Technical barrier (does it need engineers or can program staff use it?)
- Adoption evidence (are nonprofits already using this?)
- Potential impact (how much value does it deliver?)

Higher scores = easier to adopt NOW.

Also provide:
- tier: "ready_now" (score 70-100), "strategic_growth" (40-69), or "advanced_impact" (1-39)
- implementation_notes: 2-3 sentences on how a nonprofit could start implementing this today
- example_orgs: Array of 1-3 nonprofit names or types already using this (or likely early adopters)

Return ONLY valid JSON:
{"score": 85, "tier": "ready_now", "implementation_notes": "...", "example_orgs": ["..."]}`,
      },
    ],
    "You are a nonprofit technology advisor. Score AI use cases based on practical readiness for nonprofits of varying sizes. Be realistic about costs, technical requirements, and organizational capacity."
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const scored = JSON.parse(jsonMatch[0]);

    let tier: Tier = "strategic_growth";
    if (scored.score >= 70) tier = "ready_now";
    else if (scored.score < 40) tier = "advanced_impact";

    return {
      ...useCase,
      score: Math.max(1, Math.min(100, scored.score)),
      tier,
      implementation_notes: scored.implementation_notes || "",
      example_orgs: scored.example_orgs || [],
    };
  } catch {
    console.error("Failed to parse scoring response:", response);
    return {
      ...useCase,
      score: 50,
      tier: "strategic_growth",
      implementation_notes: "Contact a nonprofit technology consultant for implementation guidance.",
      example_orgs: [],
    };
  }
}
