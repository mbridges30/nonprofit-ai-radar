import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agentRuns } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const runs = db
    .select()
    .from(agentRuns)
    .orderBy(desc(agentRuns.id))
    .limit(10)
    .all();

  return NextResponse.json(runs);
}
