const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

/**
 * Reasoning effort. These calls are structured extraction against an explicit
 * rubric, so "low" is the sensible default. Curation passes that need real
 * judgement override this.
 */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callClaude(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  maxTokens = 4096,
  effort: Effort = "low"
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort },
    messages,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const data = await response.json();

  // Safety classifiers can decline a request (HTTP 200 + stop_reason "refusal")
  if (data.stop_reason === "refusal") {
    throw new Error(
      `Claude declined the request (${data.stop_details?.category ?? "unknown"})`
    );
  }

  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );
  return textBlock?.text || "";
}
