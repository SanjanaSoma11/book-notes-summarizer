import { NextRequest, NextResponse } from "next/server";
import { normalizeNotes, formatHighlightsForPrompt } from "@/lib/normalizer";
import { validateOutput, validateCitations, computeMetrics, MODES, type Mode } from "@/lib/schema";
import { buildSystemPrompt, buildUserPrompt, buildRepairPrompt } from "@/lib/prompts";
import { generateJSON } from "@/lib/groq";
import { retrieveEvidence } from "@/lib/retrieval";

export const runtime = "nodejs";
export const maxDuration = 60;

// Mode-specific temperatures
const MODE_TEMPS: Record<Mode, Record<string, number>> = {
  oneMinute:  { strict: 0.25, balanced: 0.35 },
  technical:  { strict: 0.2,  balanced: 0.3  },
  kidFriendly:{ strict: 0.35, balanced: 0.45 },
  interview:  { strict: 0.2,  balanced: 0.3  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, notesText, useRAG = true, strictness = "strict" } = body as {
      mode: string; notesText: string; useRAG?: boolean; strictness?: "strict" | "balanced";
    };

    if (!mode || !MODES.includes(mode as Mode))
      return NextResponse.json({ error: `Invalid mode. Choose: ${MODES.join(", ")}` }, { status: 400 });
    if (!notesText || notesText.trim().length < 10)
      return NextResponse.json({ error: "Provide at least 10 characters of notes." }, { status: 400 });

    // Step 1: Normalize
    const allHighlights = normalizeNotes(notesText);
    if (allHighlights.length === 0)
      return NextResponse.json({ error: "No highlights extracted." }, { status: 400 });

    // Step 2: RAG retrieval
    let highlights = allHighlights;
    let retrievalInfo = null;
    if (useRAG && allHighlights.length > 6) {
      try {
        const r = await retrieveEvidence(allHighlights, mode as Mode);
        highlights = r.evidenceSet;
        retrievalInfo = { totalHighlights: r.totalHighlights, retrievedCount: r.retrievedCount, queries: r.queries };
      } catch { highlights = allHighlights; }
    }

    const hlBlock = formatHighlightsForPrompt(highlights);
    const sysPrompt = buildSystemPrompt(strictness as "strict" | "balanced");
    const userPrompt = buildUserPrompt(mode as Mode, hlBlock);
    const temp = MODE_TEMPS[mode as Mode][strictness] ?? 0.3;

    // Step 3: Generate
    let result = await generateJSON(sysPrompt, userPrompt, temp);
    if (!result.parsed) {
      result = await generateJSON(sysPrompt, buildRepairPrompt(result.raw, ["Not valid JSON."], hlBlock), temp);
    }

    // Step 4: Validate
    let validation = validateOutput(result.parsed);
    let citCheck = validation.success
      ? validateCitations(validation.data!, highlights)
      : { valid: false, missing: [] as string[] };

    // Step 5: Repair
    if (!validation.success || !citCheck.valid) {
      const errs = [...(validation.errors ?? []), ...citCheck.missing.map((id) => `Citation ${id} doesn't exist`)];
      result = await generateJSON(sysPrompt, buildRepairPrompt(result.raw, errs, hlBlock), temp);
      validation = validateOutput(result.parsed);
      if (validation.success) citCheck = validateCitations(validation.data!, highlights);
    }

    if (!validation.success)
      return NextResponse.json({ error: "Validation failed after repair.", details: validation.errors, raw: result.raw }, { status: 422 });

    const metrics = computeMetrics(validation.data!, highlights);

    return NextResponse.json({
      mode: validation.data!.mode, items: validation.data!.items,
      warnings: validation.data!.warnings ?? [], highlights, allHighlights,
      metrics, retrieval: retrievalInfo, timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    if (msg.includes("GROQ_API_KEY")) return NextResponse.json({ error: "Groq key not set.", help: "https://console.groq.com/keys" }, { status: 401 });
    if (msg.includes("RATE_LIMIT") || msg.includes("429")) return NextResponse.json({ error: "Rate limit reached.", help: "Wait and retry." }, { status: 429 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
