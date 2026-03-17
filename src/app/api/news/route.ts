import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsArticles } from "@/lib/schema";
import { desc, eq, and, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const nonprofitType = searchParams.get("nonprofit_type");
  const geography = searchParams.get("geography");
  const sort = searchParams.get("sort") || "date";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions = [];

  if (category) {
    conditions.push(eq(newsArticles.category, category));
  }
  if (nonprofitType) {
    conditions.push(eq(newsArticles.nonprofit_type, nonprofitType));
  }
  if (geography) {
    conditions.push(eq(newsArticles.geography, geography));
  }

  let query = db.select().from(newsArticles);

  if (conditions.length > 0) {
    query = query.where(
      conditions.length === 1 ? conditions[0] : and(...conditions)
    ) as typeof query;
  }

  const orderCol =
    sort === "relevance"
      ? desc(newsArticles.relevance_score)
      : desc(sql`coalesce(${newsArticles.published_at}, ${newsArticles.discovered_at})`);

  const results = query
    .orderBy(orderCol)
    .limit(limit)
    .offset(offset)
    .all();

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
