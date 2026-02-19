import { NextRequest, NextResponse } from "next/server";
import { normalizeNotes, formatHighlightsForPrompt } from "@/lib/normalizer";
import {
  validateOutput,
  validateCitations,
  computeMetrics,
  MODES,
  type Mode,
} from "@/lib/schema";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildRepairPrompt,
} from "@/lib/prompts";
import { generateJSON } from "@/lib/groq";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, notesText } = body as { mode: string; notesText: string };

    // ── Input validation ─────────────────────────
    if (!mode || !MODES.includes(mode as Mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Choose one of: ${MODES.join(", ")}` },
        { status: 400 },
      );
    }
    if (!notesText || notesText.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide at least 10 characters of notes." },
        { status: 400 },
      );
    }

    // ── Step 1: Normalize ────────────────────────
    const highlights = normalizeNotes(notesText);
    if (highlights.length === 0) {
      return NextResponse.json(
        { error: "Could not extract any highlights from your notes." },
        { status: 400 },
      );
    }
    const hlBlock = formatHighlightsForPrompt(highlights);

    // ── Step 2: Generate with Groq ───────────────
    const userPrompt = buildUserPrompt(mode as Mode, hlBlock);
    let result = await generateJSON(SYSTEM_PROMPT, userPrompt);

    if (!result.parsed) {
      const repairPrompt = buildRepairPrompt(
        result.raw,
        ["Response was not valid JSON. Return ONLY a JSON object."],
        hlBlock,
      );
      result = await generateJSON(SYSTEM_PROMPT, repairPrompt);
    }

    // ── Step 3: Validate ─────────────────────────
    let validation = validateOutput(result.parsed);
    let citCheck = validation.success
      ? validateCitations(validation.data!, highlights)
      : { valid: false, missing: [] as string[] };

    // ── Step 4: Repair (one retry) ───────────────
    if (!validation.success || !citCheck.valid) {
      const allErrors = [
        ...(validation.errors ?? []),
        ...citCheck.missing.map(
          (id) => `Citation ${id} does not exist in highlights`,
        ),
      ];

      const repairPrompt = buildRepairPrompt(result.raw, allErrors, hlBlock);
      result = await generateJSON(SYSTEM_PROMPT, repairPrompt);
      validation = validateOutput(result.parsed);

      if (validation.success) {
        citCheck = validateCitations(validation.data!, highlights);
      }
    }

    // ── Step 5: Final check ──────────────────────
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Generation failed validation even after repair attempt.",
          details: validation.errors,
          raw: result.raw,
        },
        { status: 422 },
      );
    }

    // ── Step 6: Metrics + response ───────────────
    const metrics = computeMetrics(validation.data!, highlights);

    return NextResponse.json({
      mode: validation.data!.mode,
      items: validation.data!.items,
      warnings: validation.data!.warnings ?? [],
      highlights,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("[/api/generate]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";

    if (msg.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        {
          error: "Groq API key not configured.",
          help: "Get a free key at https://console.groq.com/keys and add it as GROQ_API_KEY in your .env.local",
        },
        { status: 401 },
      );
    }

    if (msg.includes("RATE_LIMIT") || msg.includes("429")) {
      return NextResponse.json(
        {
          error:
            "Groq rate limit reached. Free tier: 30 req/min, 1000 req/day.",
          help: "Wait a moment and try again.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
