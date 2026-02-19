import { describe, it, expect } from "vitest";
import { validateOutput, validateCitations, computeMetrics, type Highlight } from "@/lib/schema";
import { normalizeNotes } from "@/lib/normalizer";

const HIGHLIGHTS: Highlight[] = [
  { highlightId: "H1", text: "Small changes compound over time to produce remarkable results." },
  { highlightId: "H2", text: "The four laws of behavior change: make it obvious, attractive, easy, satisfying." },
  { highlightId: "H3", text: "Environment design beats willpower every time." },
  { highlightId: "H4", text: "The Two-Minute Rule: scale any new habit to a two-minute version." },
  { highlightId: "H5", text: "Habit stacking links a new habit to an existing routine." },
  { highlightId: "H6", text: "Identity-based habits: become the person, not chase the goal." },
  { highlightId: "H7", text: "The Plateau of Latent Potential: results come after a threshold." },
  { highlightId: "H8", text: "Invert the four laws to break bad habits." },
];

describe("normalizeNotes", () => {
  it("splits paragraphs into highlights", () => {
    const hl = normalizeNotes("First.\n\nSecond.\n\nThird.");
    expect(hl).toHaveLength(3);
    expect(hl[0].highlightId).toBe("H1");
    expect(hl[2].highlightId).toBe("H3");
  });
  it("splits bullet lists", () => {
    const hl = normalizeNotes("- A\n- B\n- C");
    expect(hl).toHaveLength(3);
    expect(hl[0].text).toBe("A");
  });
  it("handles numbered lists", () => {
    const hl = normalizeNotes("1. First\n2. Second");
    expect(hl).toHaveLength(2);
    expect(hl[0].text).toBe("First");
  });
  it("returns empty for empty input", () => {
    expect(normalizeNotes("")).toHaveLength(0);
    expect(normalizeNotes("   ")).toHaveLength(0);
  });
  it("ignores short fragments", () => {
    const hl = normalizeNotes("Hi\n\nThis is a real paragraph.");
    expect(hl).toHaveLength(1);
  });
  it("joins multi-line paragraphs", () => {
    const hl = normalizeNotes("Line one\nLine two\n\nNew para.");
    expect(hl).toHaveLength(2);
    expect(hl[0].text).toContain("Line one Line two");
  });
});

describe("validateOutput — oneMinute", () => {
  it("passes valid output", () => {
    const r = validateOutput({
      mode: "oneMinute",
      items: [
        { text: "Small daily changes compound into big results.", citations: ["H1"] },
        { text: "The four laws guide habit formation.", citations: ["H2"] },
      ],
    });
    expect(r.success).toBe(true);
  });
  it("fails >120 words", () => {
    const r = validateOutput({ mode: "oneMinute", items: [{ text: Array(130).fill("word").join(" "), citations: ["H1"] }] });
    expect(r.success).toBe(false);
    expect(r.errors?.some((e) => e.includes("120"))).toBe(true);
  });
  it("fails empty citations", () => {
    const r = validateOutput({ mode: "oneMinute", items: [{ text: "Valid.", citations: [] }] });
    expect(r.success).toBe(false);
  });
  it("fails wrong citation format", () => {
    const r = validateOutput({ mode: "oneMinute", items: [{ text: "Valid.", citations: ["highlight1"] }] });
    expect(r.success).toBe(false);
  });
  it("fails empty items", () => {
    const r = validateOutput({ mode: "oneMinute", items: [] });
    expect(r.success).toBe(false);
  });
});

describe("validateOutput — technical", () => {
  it("passes under 250 words", () => {
    const r = validateOutput({ mode: "technical", items: [
      { text: "Compounding framework posits marginal gains accumulate nonlinearly.", citations: ["H1"] },
      { text: "Four behavioral levers constitute the habit loop.", citations: ["H2"] },
    ]});
    expect(r.success).toBe(true);
  });
  it("fails >250 words", () => {
    const r = validateOutput({ mode: "technical", items: [{ text: Array(260).fill("word").join(" "), citations: ["H1"] }] });
    expect(r.success).toBe(false);
  });
});

describe("validateOutput — interview", () => {
  it("passes exactly 5 bullets ≤18 words", () => {
    const r = validateOutput({ mode: "interview", items: [
      { text: "Compounding small improvements daily creates massive results.", citations: ["H1"] },
      { text: "Four laws framework: obvious, attractive, easy, satisfying.", citations: ["H2"] },
      { text: "Environment design outperforms willpower for behavior change.", citations: ["H3"] },
      { text: "Two-Minute Rule reduces friction for new habits.", citations: ["H4"] },
      { text: "Identity-based approach builds durable habits.", citations: ["H6"] },
    ]});
    expect(r.success).toBe(true);
  });
  it("fails with 4 bullets", () => {
    const r = validateOutput({ mode: "interview", items: [
      { text: "One.", citations: ["H1"] }, { text: "Two.", citations: ["H2"] },
      { text: "Three.", citations: ["H3"] }, { text: "Four.", citations: ["H4"] },
    ]});
    expect(r.success).toBe(false);
  });
  it("fails with 6 bullets", () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ text: `Point.`, citations: [`H${i + 1}`] }));
    const r = validateOutput({ mode: "interview", items });
    expect(r.success).toBe(false);
  });
  it("fails bullet >18 words", () => {
    const r = validateOutput({ mode: "interview", items: [
      { text: "This has way too many words to make sure it exceeds the eighteen word limit set by the schema validator for this mode.", citations: ["H1"] },
      { text: "Short.", citations: ["H2"] }, { text: "Short.", citations: ["H3"] },
      { text: "Short.", citations: ["H4"] }, { text: "Short.", citations: ["H5"] },
    ]});
    expect(r.success).toBe(false);
  });
});

describe("validateOutput — kidFriendly", () => {
  it("passes with analogy (imagine)", () => {
    const r = validateOutput({ mode: "kidFriendly", items: [
      { text: "Imagine your habits are like building blocks stacking up.", citations: ["H1"] },
    ]});
    expect(r.success).toBe(true);
  });
  it("passes with analogy (think of)", () => {
    const r = validateOutput({ mode: "kidFriendly", items: [
      { text: "Think of your brain as a path through the woods.", citations: ["H5"] },
    ]});
    expect(r.success).toBe(true);
  });
  it("fails without analogy", () => {
    const r = validateOutput({ mode: "kidFriendly", items: [
      { text: "Habits grow slowly then suddenly work.", citations: ["H1"] },
    ]});
    expect(r.success).toBe(false);
    expect(r.errors?.some((e) => e.toLowerCase().includes("analogy"))).toBe(true);
  });
  it("fails >120 words", () => {
    const r = validateOutput({ mode: "kidFriendly", items: [{ text: "Imagine " + Array(125).fill("word").join(" "), citations: ["H1"] }] });
    expect(r.success).toBe(false);
  });
});

describe("validateCitations", () => {
  it("passes when all exist", () => {
    const r = validateCitations({ mode: "oneMinute", items: [{ text: "T.", citations: ["H1", "H3"] }] }, HIGHLIGHTS);
    expect(r.valid).toBe(true);
  });
  it("fails with missing ID", () => {
    const r = validateCitations({ mode: "oneMinute", items: [{ text: "T.", citations: ["H1", "H99"] }] }, HIGHLIGHTS);
    expect(r.valid).toBe(false);
    expect(r.missing).toContain("H99");
  });
  it("deduplicates missing", () => {
    const r = validateCitations({ mode: "oneMinute", items: [{ text: "A.", citations: ["H99"] }, { text: "B.", citations: ["H99"] }] }, HIGHLIGHTS);
    expect(r.missing).toHaveLength(1);
  });
});

describe("computeMetrics", () => {
  it("computes correctly", () => {
    const m = computeMetrics({ mode: "oneMinute", items: [
      { text: "First point here.", citations: ["H1", "H2"] },
      { text: "Second point here.", citations: ["H3"] },
    ]}, HIGHLIGHTS);
    expect(m.wordCount).toBe(6);
    expect(m.wordLimitPass).toBe(true);
    expect(m.citationCoverage).toBe(38);
    expect(m.schemaPass).toBe(true);
  });
  it("flags word limit violation", () => {
    const m = computeMetrics({ mode: "oneMinute", items: [{ text: Array(130).fill("w").join(" "), citations: ["H1"] }] }, HIGHLIGHTS);
    expect(m.wordLimitPass).toBe(false);
  });
});

describe("edge cases", () => {
  it("rejects invalid mode", () => { expect(validateOutput({ mode: "bad" as any, items: [{ text: "T.", citations: ["H1"] }] }).success).toBe(false); });
  it("rejects missing mode", () => { expect(validateOutput({ items: [{ text: "T.", citations: ["H1"] }] }).success).toBe(false); });
  it("rejects empty text", () => { expect(validateOutput({ mode: "oneMinute", items: [{ text: "", citations: ["H1"] }] }).success).toBe(false); });
  it("handles warnings", () => {
    const r = validateOutput({ mode: "oneMinute", items: [{ text: "Test sentence.", citations: ["H1"] }], warnings: ["Low data"] });
    expect(r.success).toBe(true);
    expect(r.data?.warnings).toContain("Low data");
  });
});
