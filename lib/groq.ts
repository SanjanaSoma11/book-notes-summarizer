/**
 * Groq AI Client
 *
 * FREE tier: 30 RPM, 1000 RPD, 6000 TPM — much better than Gemini.
 * Uses Llama 3.3 70B (fast, great at JSON).
 * OpenAI-compatible API — easy to swap models.
 *
 * Get your free key: https://console.groq.com/keys
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.3-70b-versatile";

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "your-groq-api-key-here") {
    throw new Error(
      "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys"
    );
  }
  return key;
}

/**
 * Extract JSON from a response that may contain markdown fences or preamble.
 */
function extractJSON(raw: string): string {
  // 1) Markdown code fence
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // 2) Find outermost { ... }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) {
    return raw.slice(first, last + 1);
  }

  return raw.trim();
}

/**
 * Generate a JSON response from Groq (Llama 3.3 70B).
 * Uses the OpenAI-compatible /chat/completions endpoint.
 */
export async function generateJSON(
  systemPrompt: string,
  userPrompt: string
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
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errMsg = err?.error?.message || `Groq API error: ${response.status}`;

    if (response.status === 429) {
      throw new Error("RATE_LIMIT: " + errMsg);
    }
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

/**
 * Check if Groq API key is configured (no API call wasted).
 */
export async function checkGroqHealth(): Promise<{
  ok: boolean;
  model: string;
  error?: string;
}> {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "your-groq-api-key-here") {
    return {
      ok: false,
      model: MODEL,
      error:
        "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys",
    };
  }
  return { ok: true, model: MODEL };
}
