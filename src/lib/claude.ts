import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const GROQ_CURATION_MODEL =
  process.env.GROQ_CURATION_MODEL || "openai/gpt-oss-120b";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Reasoning effort. These calls are structured extraction against an explicit
 * rubric, so "low" is the sensible default. The curator overrides this with
 * "high" because deduping across many near-duplicate candidates needs real
 * judgement — on Groq this switches to the larger gpt-oss-120b model.
 */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/**
 * Provider-agnostic LLM call. Returns a JSON string (when the Groq path is
 * used, JSON mode guarantees it; when the Anthropic fallback is used, callers
 * get whatever text the model produced — which may need regex extraction).
 */
export async function callClaude(
  messages: Message[],
  systemPrompt?: string,
  maxTokens = 4096,
  effort: Effort = "low"
): Promise<string> {
  if (GROQ_API_KEY) {
    return callGroq(messages, systemPrompt, maxTokens, effort);
  }
  return callAnthropic(messages, systemPrompt, maxTokens);
}

async function callGroq(
  messages: Message[],
  systemPrompt: string | undefined,
  maxTokens: number,
  effort: Effort
): Promise<string> {
  const model = effort === "high" ? GROQ_CURATION_MODEL : GROQ_MODEL;

  const client = new Groq({ apiKey: GROQ_API_KEY });
  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];
  if (systemPrompt) chatMessages.push({ role: "system", content: systemPrompt });
  for (const m of messages) chatMessages.push(m);

  const response = await client.chat.completions.create({
    model,
    messages: chatMessages,
    response_format: { type: "json_object" },
    max_tokens: maxTokens,
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content ?? "";
}

async function callAnthropic(
  messages: Message[],
  systemPrompt: string | undefined,
  maxTokens: number
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("Neither GROQ_API_KEY nor ANTHROPIC_API_KEY is set");
  }

  const body: Record<string, unknown> = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
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
