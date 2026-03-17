const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

const SEARCH_QUERIES = [
  // Fundraising & Donor Relations
  "AI tools for nonprofit fundraising 2026",
  "generative AI nonprofit grant writing",
  "AI nonprofit donor management CRM",
  "AI donor retention prediction nonprofit",
  "AI fundraising optimization charity",
  // Program Delivery & Services
  "AI use cases nonprofit program delivery",
  "nonprofit AI chatbot beneficiary services",
  "AI case management nonprofit social services",
  "AI personalized learning nonprofit education",
  // Operations & Admin
  "artificial intelligence nonprofit operations automation",
  "AI tools nonprofit document processing",
  "AI meeting transcription nonprofit productivity",
  "AI nonprofit HR recruitment automation",
  // Marketing & Communications
  "AI tools for nonprofit marketing communications",
  "AI social media content nonprofit organization",
  "AI email marketing nonprofit engagement",
  // Advocacy & Policy
  "nonprofit AI advocacy policy analysis",
  "AI legislative monitoring nonprofit lobbying",
  // Volunteer Management
  "AI volunteer matching nonprofit",
  "AI volunteer scheduling optimization nonprofit",
  // Data & Impact Measurement
  "AI nonprofit impact measurement analytics",
  "AI nonprofit data analytics reporting",
  "machine learning nonprofit outcomes evaluation",
  "predictive analytics social impact nonprofit",
  // General / cross-cutting
  "AI use cases charity sector 2025 2026",
  "TechSoup AI nonprofit tools",
  "NTEN nonprofit technology AI trends",
  "Stanford Social Innovation Review AI nonprofit",
  "nonprofit AI implementation case study",
  "artificial intelligence social good examples",
  "AI for social impact organizations",
];

export async function braveSearch(query: string, count = 10): Promise<SearchResult[]> {
  if (!BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY not set");
  }

  const params = new URLSearchParams({
    q: query,
    count: String(count),
    freshness: "pm",
  });

  const response = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave Search error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const webResults = data.web?.results || [];

  return webResults.map((r: { title: string; url: string; description: string }) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));
}

export function getSearchQueries(batchSize = 10): string[] {
  const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, batchSize);
}
