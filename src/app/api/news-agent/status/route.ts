import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsAgentRuns } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const runs = db
    .select()
    .from(newsAgentRuns)
    .orderBy(desc(newsAgentRuns.id))
    .limit(10)
    .all();

  return NextResponse.json(runs);
}
