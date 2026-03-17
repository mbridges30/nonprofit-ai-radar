import { NextRequest, NextResponse } from "next/server";
import { runResearchAgent } from "@/lib/agent";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-agent-secret");
  const expectedSecret = process.env.AGENT_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runResearchAgent();
    return NextResponse.json({
      message: "Agent run completed",
      runId: result.runId,
      casesFound: result.casesFound,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
