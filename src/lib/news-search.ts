import RSSParser from "rss-parser";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";
const BRAVE_NEWS_URL = "https://api.search.brave.com/res/v1/news/search";

// Several nonprofit publishers (TechSoup among them) reject the default
// rss-parser agent with a 403.
const USER_AGENT =
  "Mozilla/5.0 (compatible; NonprofitAIRadar/1.0; +https://radar.bridgesstrategy.com)";

export interface RawNewsItem {
  title: string;
  url: string;
  description: string;
  source_name: string;
  published_at: string | null;
}

const NEWS_QUERIES = [
  "AI nonprofit news",
  "artificial intelligence charity sector",
  "nonprofit technology AI adoption",
  "AI tools social sector nonprofit",
  "generative AI nonprofit organizations",
  "nonprofit AI implementation",
  "AI social impact nonprofit news",
  "machine learning nonprofit sector",
];

const CURATED_RSS_FEEDS: { url: string; name: string }[] = [
  { url: "https://www.techsoup.org/rss/blog", name: "TechSoup" },
  { url: "https://ssir.org/site/rss_2.0", name: "Stanford Social Innovation Review" },
  { url: "https://www.philanthropy.com/rss", name: "Chronicle of Philanthropy" },
  { url: "https://nonprofitquarterly.org/feed/", name: "Nonprofit Quarterly" },
  { url: "https://www.nonprofitpro.com/feed/", name: "NonProfit PRO" },
  { url: "https://www.nten.org/feed/", name: "NTEN" },
  { url: "https://www.thenonprofittimes.com/feed/", name: "The NonProfit Times" },
];

const GOOGLE_ALERTS_FEEDS: string[] = [
  "https://www.google.com/alerts/feeds/05638380350467677510/5043671743702139200",
];

/**
 * Brave returns a human age ("9 hours ago", "2 days ago") rather than a
 * timestamp, and storing that verbatim made published_at unsortable — the news
 * feed ordered by string comparison against real ISO dates. Convert to ISO,
 * preferring Brave's page_age when it supplies one.
 */
function normalisePublishedAt(
  age: string | null | undefined,
  pageAge?: string | null
): string | null {
  if (pageAge) {
    const parsed = new Date(pageAge);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (!age) return null;

  const direct = new Date(age);
  if (!isNaN(direct.getTime())) return direct.toISOString();

  const match = age.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/i);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unitMs: Record<string, number> = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
  };
  const ms = unitMs[match[2].toLowerCase()];
  if (!ms) return null;

  return new Date(Date.now() - amount * ms).toISOString();
}

export async function braveNewsSearch(
  query: string,
  count = 10
): Promise<RawNewsItem[]> {
  if (!BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY not set");
  }

  const params = new URLSearchParams({
    q: query,
    count: String(count),
    freshness: "pw",
  });

  const response = await fetch(`${BRAVE_NEWS_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Brave News error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const results = data.results || [];

  return results.map(
    (r: {
      title: string;
      url: string;
      description: string;
      meta_url?: { hostname: string };
      age?: string;
      page_age?: string;
    }) => ({
      title: r.title,
      url: r.url,
      description: r.description || "",
      source_name: r.meta_url?.hostname?.replace(/^www\./, "") || "Unknown",
      published_at: normalisePublishedAt(r.age, r.page_age),
    })
  );
}

async function fetchRSSFeed(
  feedUrl: string,
  sourceName?: string
): Promise<RawNewsItem[]> {
  const parser = new RSSParser({
    timeout: 15000,
    headers: { "User-Agent": USER_AGENT },
  });
  try {
    const feed = await parser.parseURL(feedUrl);
    const name = sourceName || feed.title || "Unknown";

    return (feed.items || []).map((item) => ({
      title: item.title || "Untitled",
      url: item.link || "",
      description: item.contentSnippet || item.content || "",
      source_name: name,
      published_at: item.isoDate || item.pubDate || null,
    }));
  } catch (err) {
    console.error(`Failed to parse RSS feed ${feedUrl}:`, err);
    return [];
  }
}

export function getNewsQueries(batchSize = 5): string[] {
  const shuffled = [...NEWS_QUERIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, batchSize);
}

/**
 * Google Alerts wraps URLs in redirects and sometimes uses the URL as the title.
 * This cleans both issues.
 */
function cleanItem(item: RawNewsItem): RawNewsItem {
  let url = item.url;

  // Extract real URL from Google redirect
  if (url.includes("google.com/url")) {
    try {
      const parsed = new URL(url);
      const realUrl = parsed.searchParams.get("url");
      if (realUrl) url = realUrl;
    } catch { /* keep original */ }
  }

  // Strip HTML tags from title (Google Alerts bolds search terms)
  let title = item.title.replace(/<[^>]*>/g, "").trim();

  // If title looks like a URL, generate a readable one from the URL path
  if (title.startsWith("http") || title.startsWith("www.") || title.length === 0) {
    try {
      const parsed = new URL(url);
      const slug = parsed.pathname
        .split("/")
        .filter(Boolean)
        .pop() || "";
      title = slug
        .replace(/[-_]/g, " ")
        .replace(/\.\w+$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      if (!title) title = parsed.hostname.replace(/^www\./, "");
    } catch {
      title = "Untitled";
    }
  }

  // Extract source_name from the real URL instead of "Google Alerts"
  let sourceName = item.source_name;
  if (sourceName === "Google Alerts") {
    try {
      sourceName = new URL(url).hostname.replace(/^www\./, "");
    } catch { /* keep original */ }
  }

  return { ...item, url, title, source_name: sourceName };
}

export async function fetchAllNewsSources(): Promise<RawNewsItem[]> {
  const allItems: RawNewsItem[] = [];
  const seenUrls = new Set<string>();

  const addItems = (items: RawNewsItem[]) => {
    for (const item of items) {
      if (!item.url) continue;
      const cleaned = cleanItem(item);
      if (!seenUrls.has(cleaned.url)) {
        seenUrls.add(cleaned.url);
        allItems.push(cleaned);
      }
    }
  };

  // 1. Brave News search
  const queries = getNewsQueries(5);
  for (const query of queries) {
    try {
      const results = await braveNewsSearch(query, 10);
      addItems(results);
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`Brave News search failed for "${query}":`, err);
    }
  }

  // 2. Google Alerts RSS feeds
  for (const feedUrl of GOOGLE_ALERTS_FEEDS) {
    const items = await fetchRSSFeed(feedUrl, "Google Alerts");
    addItems(items);
  }

  // 3. Curated RSS feeds
  const rssPromises = CURATED_RSS_FEEDS.map((feed) =>
    fetchRSSFeed(feed.url, feed.name)
  );
  const rssResults = await Promise.all(rssPromises);
  for (const items of rssResults) {
    addItems(items);
  }

  return allItems;
}
