import { z } from "zod";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HIGHLIGHT SCHEMA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HighlightSchema = z.object({
  highlightId: z
    .string()
    .regex(/^H\d+$/, "Highlight ID must match format H1, H2, etc."),
  text: z.string().min(3, "Highlight text must be at least 3 characters"),
  page: z.number().optional(),
  chapter: z.string().optional(),
  location: z.string().optional(),
});

export type Highlight = z.infer<typeof HighlightSchema>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MODES = ["oneMinute", "technical", "kidFriendly", "interview"] as const;
export type Mode = (typeof MODES)[number];

export const MODE_META: Record<
  Mode,
  { label: string; description: string; icon: string; wordLimit: number }
> = {
  oneMinute: {
    label: "1-Minute",
    description: "Concise overview: thesis + key points in ≤120 words",
    icon: "⏱",
    wordLimit: 120,
  },
  technical: {
    label: "Technical",
    description: "Deep dive: frameworks, mechanisms, tradeoffs in ≤250 words",
    icon: "🔬",
    wordLimit: 250,
  },
  kidFriendly: {
    label: "Kid-Friendly",
    description: "Simple language with analogies in ≤120 words",
    icon: "🧒",
    wordLimit: 120,
  },
  interview: {
    label: "Interview",
    description: "Exactly 5 bullets, each ≤18 words",
    icon: "💼",
    wordLimit: 90,
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OUTPUT SCHEMAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const OutputItemSchema = z.object({
  text: z.string().min(1, "Item text cannot be empty"),
  citations: z
    .array(z.string().regex(/^H\d+$/, "Each citation must match H1, H2, etc."))
    .min(1, "Every item must cite at least one highlight"),
});

export type OutputItem = z.infer<typeof OutputItemSchema>;

export const BaseOutputSchema = z.object({
  mode: z.enum(MODES),
  items: z.array(OutputItemSchema).min(1, "Must produce at least one item"),
  warnings: z.array(z.string()).optional(),
});

export type BaseOutput = z.infer<typeof BaseOutputSchema>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WORD HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function totalWords(items: OutputItem[]): number {
  return items.reduce((sum, i) => sum + countWords(i.text), 0);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODE VALIDATORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OneMinuteSchema = BaseOutputSchema.extend({
  mode: z.literal("oneMinute"),
}).refine((d) => totalWords(d.items) <= 120, {
  message: "1-Minute mode: total words must be ≤ 120",
  path: ["items"],
});

const TechnicalSchema = BaseOutputSchema.extend({
  mode: z.literal("technical"),
}).refine((d) => totalWords(d.items) <= 120, {
  message: "Technical mode: total words must be ≤ 120",
  path: ["items"],
});

const ANALOGY_MARKERS = [
  "like ", "like a ", "imagine ", "pretend ", "as if ",
  "similar to ", "think of ", "just as ", "picture ",
];

const KidFriendlySchema = BaseOutputSchema.extend({
  mode: z.literal("kidFriendly"),
})
  .refine((d) => totalWords(d.items) <= 240, {
    message: "Kid-Friendly mode: total words must be ≤ 240",
    path: ["items"],
  })
  .refine(
    (d) => {
      const blob = d.items.map((i) => i.text).join(" ").toLowerCase();
      return ANALOGY_MARKERS.some((m) => blob.includes(m));
    },
    {
      message: 'Kid-Friendly mode must include an analogy (use "like", "imagine", "pretend", etc.)',
      path: ["items"],
    }
  );

const InterviewSchema = BaseOutputSchema.extend({
  mode: z.literal("interview"),
})
  .refine((d) => d.items.length === 5, {
    message: "Interview mode requires exactly 5 bullets",
    path: ["items"],
  })
  .refine((d) => d.items.every((i) => countWords(i.text) <= 100), {
    message: "Interview mode: each bullet must be ≤ 100 words",
    path: ["items"],
  });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED VALIDATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ValidationResult {
  success: boolean;
  data?: BaseOutput;
  errors?: string[];
}

export function validateOutput(raw: unknown): ValidationResult {
  const base = BaseOutputSchema.safeParse(raw);
  if (!base.success) {
    return {
      success: false,
      errors: base.error.errors.map((e) => `[${e.path.join(".")}] ${e.message}`),
    };
  }

  const schemas: Record<Mode, z.ZodTypeAny> = {
    oneMinute: OneMinuteSchema,
    technical: TechnicalSchema,
    kidFriendly: KidFriendlySchema,
    interview: InterviewSchema,
  };

  const result = schemas[base.data.mode].safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((e) => `[${e.path.join(".")}] ${e.message}`),
    };
  }

  return { success: true, data: base.data };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CITATION VALIDATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateCitations(
  output: BaseOutput,
  highlights: Highlight[]
): { valid: boolean; missing: string[] } {
  const ids = new Set(highlights.map((h) => h.highlightId));
  const missing: string[] = [];
  for (const item of output.items) {
    for (const c of item.citations) {
      if (!ids.has(c)) missing.push(c);
    }
  }
  return { valid: missing.length === 0, missing: [...new Set(missing)] };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRICS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RunMetrics {
  schemaPass: boolean;
  wordCount: number;
  wordLimitPass: boolean;
  citationCoverage: number;
  itemCount: number;
  avgWordsPerItem: number;
  validCitations: boolean;
  missingCitations: string[];
  timestamp: string;
}

export function computeMetrics(output: BaseOutput, highlights: Highlight[]): RunMetrics {
  const wc = totalWords(output.items);
  const limit = MODE_META[output.mode].wordLimit;
  const citCheck = validateCitations(output, highlights);
  const usedIds = new Set(output.items.flatMap((i) => i.citations));
  const coverage = highlights.length > 0 ? (usedIds.size / highlights.length) * 100 : 0;

  return {
    schemaPass: validateOutput(output).success,
    wordCount: wc,
    wordLimitPass: wc <= limit,
    citationCoverage: Math.round(coverage),
    itemCount: output.items.length,
    avgWordsPerItem: output.items.length > 0 ? Math.round(wc / output.items.length) : 0,
    validCitations: citCheck.valid,
    missingCitations: citCheck.missing,
    timestamp: new Date().toISOString(),
  };
}
