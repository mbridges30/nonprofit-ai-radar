import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { useCases } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { CATEGORIES } from "@/types";

export async function GET() {
  const counts = db
    .select({
      category: useCases.category,
      tier: useCases.tier,
      count: sql<number>`count(*)`,
    })
    .from(useCases)
    .groupBy(useCases.category, useCases.tier)
    .all();

  const result = CATEGORIES.map((cat) => {
    const catCounts = counts.filter((c) => c.category === cat);
    return {
      category: cat,
      total: catCounts.reduce((sum, c) => sum + c.count, 0),
      ready_now: catCounts.find((c) => c.tier === "ready_now")?.count || 0,
      strategic_growth: catCounts.find((c) => c.tier === "strategic_growth")?.count || 0,
      advanced_impact: catCounts.find((c) => c.tier === "advanced_impact")?.count || 0,
    };
  });

  return NextResponse.json(result);
}
