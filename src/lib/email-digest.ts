import { db } from "./db";
import { newsArticles, subscribers } from "./schema";
import { eq, desc, gte } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://radar.bridgesstrategy.com";

interface DigestArticle {
  title: string;
  url: string;
  summary: string | null;
  source_name: string;
  relevance_score: number | null;
  nonprofit_type: string;
}

function buildDigestHtml(articles: DigestArticle[], unsubscribeToken: string): string {
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
            ${a.relevance_score && a.relevance_score >= 80 ? " &middot; ⭐ Highly Relevant" : ""}
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
        <a href="${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}" style="color: #bbb; font-size: 11px;">
          Unsubscribe
        </a>
      </div>
    </div>
  `;
}

export async function sendWeeklyDigest(): Promise<{ sent: number; articles: number }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not set");
  }

  // Get confirmed subscribers
  const subs = db
    .select()
    .from(subscribers)
    .where(eq(subscribers.confirmed, 1))
    .all();

  if (subs.length === 0) {
    console.log("[Digest] No confirmed subscribers");
    return { sent: 0, articles: 0 };
  }

  // Get articles from the past 7 days, ordered by relevance
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentArticles = db
    .select()
    .from(newsArticles)
    .where(gte(newsArticles.discovered_at, sevenDaysAgo.toISOString()))
    .orderBy(desc(newsArticles.relevance_score))
    .limit(15)
    .all();

  if (recentArticles.length === 0) {
    console.log("[Digest] No articles from the past week");
    return { sent: 0, articles: 0 };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);
  const fromAddress = process.env.EMAIL_FROM || "Nonprofit AI Radar <noreply@bridgesstrategy.com>";

  let sent = 0;
  for (const sub of subs) {
    try {
      const html = buildDigestHtml(recentArticles, sub.unsubscribe_token);
      await resend.emails.send({
        from: fromAddress,
        to: sub.email,
        subject: `AI in Nonprofits: ${recentArticles.length} stories this week`,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`[Digest] Failed to send to ${sub.email}:`, err);
    }
  }

  return { sent, articles: recentArticles.length };
}
