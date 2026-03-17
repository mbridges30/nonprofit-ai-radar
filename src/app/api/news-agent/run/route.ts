import { NextRequest, NextResponse } from "next/server";
import { runNewsAgent } from "@/lib/news-agent";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-agent-secret");
  const expectedSecret = process.env.AGENT_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNewsAgent();
    return NextResponse.json({
      message: "News agent run completed",
      runId: result.runId,
      articlesFound: result.articlesFound,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
