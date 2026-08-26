import { db } from "./db";
import { newsArticles } from "./schema";
import { desc, gte, sql } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radar.bridgesstrategy.com";
const KIT_API_URL = "https://api.kit.com/v4/broadcasts";

/**
 * "draft"  — create the broadcast in Kit and leave it for manual review/send.
 * "send"   — schedule it to go out immediately.
 * Draft is the default: the digest is generated from an automated news feed,
 * so it is worth a human glance before it reaches subscribers.
 */
type DigestMode = "draft" | "send";

interface DigestArticle {
  title: string;
  url: string;
  summary: string | null;
  source_name: string;
  relevance_score: number | null;
  nonprofit_type: string;
}

function buildDigestHtml(articles: DigestArticle[]): string {
  const articleRows = articles
    .map(
      (a) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <a href="${a.url}" style="color: #4a8284; font-weight: 600; text-decoration: none; font-size: 14px;">
            ${a.title}
          </a>
          ${a.summary ? `<p style="color: #666; font-size: 13px; margin: 4px 0 0;">${a.summary}</p>` : ""}
          <p style="color: #999; font-size: 11px; margin: 4px 0 0;">
            ${a.source_name} &middot; ${a.nonprofit_type}
            ${a.relevance_score && a.relevance_score >= 80 ? " &middot; Highly relevant" : ""}
          </p>
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4a8284; font-size: 20px; margin: 0;">AI in Nonprofits</h1>
        <p style="color: #999; font-size: 13px; margin: 4px 0 0;">Weekly News Digest</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        ${articleRows}
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${SITE_URL}/news" style="display: inline-block; background: #5f9ea0; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
          View All News
        </a>
      </div>

      <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee;">
        <p style="color: #bbb; font-size: 11px;">
          Curated by <a href="${SITE_URL}" style="color: #999;">Nonprofit AI Radar</a> by Bridges Strategy
        </p>
      </div>
    </div>
  `;
}

/**
 * Builds the weekly digest and hands it to Kit as a broadcast.
 *
 * Subscribers live in Kit (that is where the signup form sends them), so Kit
 * owns delivery, unsubscribes and compliance. Previously this read a local
 * `subscribers` table that nothing had written to since the switch to Kit,
 * which is why no digest ever reached anyone.
 */
export async function sendWeeklyDigest(): Promise<{
  broadcastId: number | null;
  articles: number;
  mode: DigestMode;
}> {
  const kitApiKey = process.env.KIT_API_KEY || process.env.KIT_V4_API_KEY;
  if (!kitApiKey) {
    throw new Error(
      "KIT_API_KEY not set — create a v4 API key at kit.com under Settings > Developer"
    );
  }

  const mode: DigestMode = process.env.DIGEST_MODE === "send" ? "send" : "draft";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentArticles = db
    .select()
    .from(newsArticles)
    .where(gte(newsArticles.discovered_at, sevenDaysAgo.toISOString()))
    .orderBy(desc(newsArticles.relevance_score))
    .limit(12)
    .all();

  if (recentArticles.length === 0) {
    console.log("[Digest] No articles from the past week — nothing to send");
    return { broadcastId: null, articles: 0, mode };
  }

  const today = new Date().toISOString().split("T")[0];

  const res = await fetch(KIT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": kitApiKey,
    },
    body: JSON.stringify({
      subject: `AI in Nonprofits: ${recentArticles.length} stories this week`,
      preview_text: recentArticles[0].title,
      description: `Weekly digest ${today}`,
      content: buildDigestHtml(recentArticles),
      public: false,
      // null leaves it as a draft in Kit; a timestamp schedules the send.
      send_at: mode === "send" ? new Date().toISOString() : null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kit broadcast failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  const broadcastId = data?.broadcast?.id ?? null;

  console.log(
    `[Digest] Kit broadcast ${broadcastId} created as ${mode} with ${recentArticles.length} articles`
  );

  return { broadcastId, articles: recentArticles.length, mode };
}
