import RSSParser from "rss-parser";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";
const BRAVE_NEWS_URL = "https://api.search.brave.com/res/v1/news/search";

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
  { url: "https://feeds.feedburner.com/ssaboratoire", name: "Stanford Social Innovation Review" },
  { url: "https://www.philanthropy.com/rss", name: "Chronicle of Philanthropy" },
  { url: "https://nonprofitquarterly.org/feed/", name: "Nonprofit Quarterly" },
  { url: "https://www.nonprofitpro.com/feed/", name: "NonProfit PRO" },
  { url: "https://blog.nten.org/feed/", name: "NTEN" },
];

const GOOGLE_ALERTS_FEEDS: string[] = [
  "https://www.google.com/alerts/feeds/05638380350467677510/5043671743702139200",
];

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
    }) => ({
      title: r.title,
      url: r.url,
      description: r.description || "",
      source_name: r.meta_url?.hostname?.replace(/^www\./, "") || "Unknown",
      published_at: r.age || null,
    })
  );
}

async function fetchRSSFeed(
  feedUrl: string,
  sourceName?: string
): Promise<RawNewsItem[]> {
  const parser = new RSSParser();
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
function cleanGoogleAlertsItem(item: RawNewsItem): RawNewsItem {
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
      if (item.url && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        // Strip any HTML tags from titles (Brave, Google Alerts, and some RSS feeds include them)
        const cleanTitle = item.title.replace(/<[^>]*>/g, "").trim();
        allItems.push({ ...item, title: cleanTitle || item.title });
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

  // 2. Google Alerts RSS feeds (clean redirect URLs and HTML titles)
  for (const feedUrl of GOOGLE_ALERTS_FEEDS) {
    const items = await fetchRSSFeed(feedUrl, "Google Alerts");
    addItems(items.map(cleanGoogleAlertsItem));
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
