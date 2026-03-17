import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { useCases } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const tier = searchParams.get("tier");

  const conditions = [];
  if (category) conditions.push(eq(useCases.category, category));
  if (tier) conditions.push(eq(useCases.tier, tier));

  const results = await db
    .select()
    .from(useCases)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(useCases.date_found));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, source_url, source_name, category, tier, score, implementation_notes, example_orgs, date_found } = body;

  if (!title || !description || !category || !tier || score === undefined || !date_found) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = db.insert(useCases).values({
    title,
    description,
    source_url: source_url || null,
    source_name: source_name || null,
    category,
    tier,
    score,
    implementation_notes: implementation_notes || null,
    example_orgs: example_orgs || null,
    date_found,
  }).returning();

  const inserted = result.get();
  return NextResponse.json(inserted, { status: 201 });
}
