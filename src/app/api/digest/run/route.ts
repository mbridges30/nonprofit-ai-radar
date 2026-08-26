import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/email-digest";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-agent-secret");
  const expectedSecret = process.env.AGENT_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendWeeklyDigest();
    return NextResponse.json({
      message:
        result.articles === 0
          ? "No articles from the past week — nothing to send"
          : `Digest created in Kit as ${result.mode}`,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
