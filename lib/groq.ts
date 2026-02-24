/**
 * Groq AI Client — FREE, 30 RPM, 1000 RPD
 * Uses Llama 3.3 70B. OpenAI-compatible API.
 * Get key: https://console.groq.com/keys
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile";

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key === "your-groq-api-key-here") {
    throw new Error("GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys");
  }
  return key;
}

function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) return raw.slice(first, last + 1);
  return raw.trim();
}

/**
 * Generate JSON. Temperature varies by strictness.
 */
export async function generateJSON(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.3
): Promise<{ raw: string; parsed: unknown }> {
  const apiKey = getApiKey();

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errMsg = err?.error?.message || `Groq API error: ${response.status}`;
    if (response.status === 429) throw new Error("RATE_LIMIT: " + errMsg);
    throw new Error(errMsg);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = extractJSON(raw);

  try {
    return { raw, parsed: JSON.parse(cleaned) };
  } catch {
    return { raw, parsed: null };
  }
}

export async function checkGroqHealth(): Promise<{ ok: boolean; model: string; error?: string }> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key === "your-groq-api-key-here") {
    return { ok: false, model: MODEL, error: "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys" };
  }
  return { ok: true, model: MODEL };
}
