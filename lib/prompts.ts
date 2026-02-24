import { Mode } from "./schema";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYSTEM PROMPT — shared, with quality rules
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildSystemPrompt(strictness: "strict" | "balanced"): string {
  const base = `You are a precision book-notes summarizer. Your ONLY source of truth is the numbered highlights provided.

GROUNDING RULES:
- Do NOT add facts, claims, or ideas not present in the highlights.
- Every sentence must be directly traceable to one or more highlights.
- If highlights are insufficient, add entries to "warnings" instead of fabricating.
${strictness === "balanced" ? '- You may make mild inferences clearly supported by multiple highlights. Mark inferred items with "support": "inferred". Direct claims use "support": "direct".' : '- Make NO inferences. Every claim must be directly stated in a highlight. All items must have "support": "direct".'}

CITATION RULES:
- Each item must cite 1–2 highlights that directly support the claim.
- If citing 2+ highlights, the sentence must clearly combine information from both.
- Do not cite the same highlight in more than 2 items unless unavoidable.
- Citations must be meaningful — the cited highlight must contain the specific claim.

QUALITY RULES:
- Avoid generic filler phrases like "This book emphasizes…", "The author argues…", "It is important to note…"
- Each item must contain at least one concrete noun or specific term from the highlights.
- No repeated ideas across items — every item must add new information.
- Before finalizing: verify each item adds unique value not already stated elsewhere.

FORMAT:
- Return ONLY a valid JSON object. No markdown. No backticks. No explanation.
- Start with { and end with }. Nothing else.`;

  return base;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODE INSTRUCTIONS — with correct item counts + multi-item examples
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MODE_INSTRUCTIONS: Record<Mode, string> = {
  oneMinute: `MODE: oneMinute (1-Minute Summary)
RULES:
- Total words across ALL items: ≤ 120
- Return exactly 4 items in this order: Thesis, Key Point 1, Key Point 2, Conclusion
- Each item needs 1–2 citations
- Keep language direct and concrete

EXACT JSON SHAPE:
{
  "mode": "oneMinute",
  "items": [
    { "text": "The central thesis is that small daily improvements compound into transformative results over time.", "citations": ["H1"], "support": "direct" },
    { "text": "Four behavioral laws—obvious, attractive, easy, satisfying—form the practical framework for building habits.", "citations": ["H2"], "support": "direct" },
    { "text": "Environment design consistently outperforms willpower as a strategy for behavior change.", "citations": ["H3"], "support": "direct" },
    { "text": "Lasting change comes from identity shifts, not outcome-based goals.", "citations": ["H6"], "support": "direct" }
  ],
  "warnings": []
}`,

  technical: `MODE: technical (Technical Deep Dive)
RULES:
- Total words across ALL items: ≤ 250
- Return 5–7 items covering: Core Framework, Mechanism 1, Mechanism 2, Implementation Detail, Tradeoff/Limitation, Synthesis
- Use precise terminology from the highlights
- Each item needs 1–2 citations

EXACT JSON SHAPE:
{
  "mode": "technical",
  "items": [
    { "text": "The compounding framework posits that 1% daily gains yield 37x annual improvement through exponential accumulation.", "citations": ["H1"], "support": "direct" },
    { "text": "Four behavioral levers—cue visibility, reward attractiveness, friction reduction, and satisfaction—constitute the habit loop architecture.", "citations": ["H2"], "support": "direct" },
    { "text": "Environmental affordances demonstrably outperform volitional self-control as behavior-change mechanisms.", "citations": ["H3"], "support": "direct" },
    { "text": "The Two-Minute Rule operationalizes friction reduction by constraining initial habit scope to minimal viable actions.", "citations": ["H4"], "support": "direct" },
    { "text": "Habit stacking exploits existing neural pathways by chaining new behaviors to established routines.", "citations": ["H5"], "support": "direct" },
    { "text": "Identity-based framing shifts motivation from extrinsic outcomes to intrinsic self-concept, increasing durability.", "citations": ["H6"], "support": "direct" }
  ],
  "warnings": []
}`,

  kidFriendly: `MODE: kidFriendly (Kid-Friendly)
RULES:
- Total words across ALL items: ≤ 120
- Return exactly 3 items: Simple Idea, Analogy, Fun Example
- MUST include at least one analogy using "like", "imagine", "pretend", "think of", or "picture"
- Use vocabulary a 10-year-old would understand
- Each item needs 1–2 citations

EXACT JSON SHAPE:
{
  "mode": "kidFriendly",
  "items": [
    { "text": "Tiny improvements every day add up to something huge, like how saving one penny a day eventually fills a whole jar.", "citations": ["H1"], "support": "direct" },
    { "text": "There are four tricks to build good habits: make them easy to see, fun to do, simple to start, and feel good after.", "citations": ["H2"], "support": "direct" },
    { "text": "Instead of saying 'I want to read more,' think of yourself as 'a reader'—that makes the habit stick better.", "citations": ["H6"], "support": "direct" }
  ],
  "warnings": []
}`,

  interview: `MODE: interview (Interview Prep)
RULES:
- EXACTLY 5 items. Not 4, not 6. Exactly 5.
- Each item text: ≤ 18 words.
- Phrase each as a professional insight, skill, or actionable takeaway.
- Each item needs 1–2 citations.

EXACT JSON SHAPE:
{
  "mode": "interview",
  "items": [
    { "text": "Marginal 1% daily improvements compound into 37x annual gains through consistent execution.", "citations": ["H1"], "support": "direct" },
    { "text": "Four-law framework: make habits obvious, attractive, easy, and satisfying for systematic adoption.", "citations": ["H2"], "support": "direct" },
    { "text": "Environmental design outperforms willpower—structure surroundings to make desired behaviors effortless.", "citations": ["H3"], "support": "direct" },
    { "text": "Two-Minute Rule reduces activation energy by scaling new habits to minimal starting versions.", "citations": ["H4"], "support": "direct" },
    { "text": "Identity-based habits drive lasting change by aligning actions with desired self-concept.", "citations": ["H6"], "support": "direct" }
  ],
  "warnings": []
}`,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUILD USER PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildUserPrompt(mode: Mode, highlightsBlock: string): string {
  return `${MODE_INSTRUCTIONS[mode]}

HIGHLIGHTS (your ONLY source — cite by ID):

${highlightsBlock}

Return ONLY the JSON object. No markdown. No explanation.`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPAIR PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function buildRepairPrompt(
  invalidJson: string, errors: string[], highlightsBlock: string
): string {
  return `Your previous response FAILED validation. Fix ALL errors and return corrected JSON only.

ERRORS:
${errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n")}

YOUR INVALID OUTPUT:
${invalidJson}

HIGHLIGHTS (same as before):
${highlightsBlock}

Return ONLY the corrected JSON. No markdown. No explanation. Start with { end with }.`;
}
