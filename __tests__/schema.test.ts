import { describe, it, expect } from "vitest";
import { validateOutput, validateCitations, computeMetrics, type Highlight } from "@/lib/schema";
import { normalizeNotes } from "@/lib/normalizer";
import { cosineSimilarity } from "@/lib/embeddings";

const HL: Highlight[] = [
  { highlightId: "H1", text: "Small changes compound over time to produce remarkable results." },
  { highlightId: "H2", text: "The four laws: make it obvious, attractive, easy, satisfying." },
  { highlightId: "H3", text: "Environment design beats willpower." },
  { highlightId: "H4", text: "Two-Minute Rule: scale any habit to two minutes." },
  { highlightId: "H5", text: "Habit stacking links new habits to existing routines." },
  { highlightId: "H6", text: "Identity-based habits: become the person." },
  { highlightId: "H7", text: "Plateau of Latent Potential: results after threshold." },
  { highlightId: "H8", text: "Invert the four laws to break bad habits." },
];

// ━━━ NORMALIZER ━━━
describe("normalizeNotes", () => {
  it("splits paragraphs", () => { expect(normalizeNotes("A.\n\nB.\n\nC.")).toHaveLength(3); });
  it("splits bullets", () => { expect(normalizeNotes("- A\n- B\n- C")).toHaveLength(3); });
  it("empty input", () => { expect(normalizeNotes("")).toHaveLength(0); });
  it("joins multiline", () => { expect(normalizeNotes("L1\nL2\n\nP2.")[0].text).toContain("L1 L2"); });
});

// ━━━ oneMinute ━━━ (≤120 words, 3–5 items)
describe("oneMinute", () => {
  it("passes 4 items under 120 words", () => {
    expect(validateOutput({ mode: "oneMinute", items: [
      { text: "Thesis point.", citations: ["H1"] },
      { text: "Key point one.", citations: ["H2"] },
      { text: "Key point two.", citations: ["H3"] },
      { text: "Conclusion.", citations: ["H6"] },
    ]}).success).toBe(true);
  });
  it("fails with 2 items (needs 3–5)", () => {
    expect(validateOutput({ mode: "oneMinute", items: [
      { text: "A.", citations: ["H1"] }, { text: "B.", citations: ["H2"] },
    ]}).success).toBe(false);
  });
  it("fails >120 words", () => {
    expect(validateOutput({ mode: "oneMinute", items: [
      { text: Array(50).fill("word").join(" "), citations: ["H1"] },
      { text: Array(50).fill("word").join(" "), citations: ["H2"] },
      { text: Array(30).fill("word").join(" "), citations: ["H3"] },
    ]}).success).toBe(false);
  });
});

// ━━━ technical ━━━ (≤250 words, 4–8 items)
describe("technical", () => {
  it("passes 5 items under 250 words", () => {
    expect(validateOutput({ mode: "technical", items: [
      { text: "Framework analysis.", citations: ["H1"] },
      { text: "Mechanism detail.", citations: ["H2"] },
      { text: "Implementation point.", citations: ["H3"] },
      { text: "Tradeoff consideration.", citations: ["H4"] },
      { text: "Synthesis conclusion.", citations: ["H5"] },
    ]}).success).toBe(true);
  });
  it("fails >250 words", () => {
    const long = Array(260).fill("word").join(" ");
    expect(validateOutput({ mode: "technical", items: [
      { text: long, citations: ["H1"] },
      { text: "B.", citations: ["H2"] },
      { text: "C.", citations: ["H3"] },
      { text: "D.", citations: ["H4"] },
    ]}).success).toBe(false);
  });
  it("fails with 3 items (needs 4–8)", () => {
    expect(validateOutput({ mode: "technical", items: [
      { text: "A.", citations: ["H1"] }, { text: "B.", citations: ["H2"] },
      { text: "C.", citations: ["H3"] },
    ]}).success).toBe(false);
  });
});

// ━━━ interview ━━━ (exactly 5, ≤18 words each)
describe("interview", () => {
  it("passes 5 bullets ≤18 words", () => {
    expect(validateOutput({ mode: "interview", items: [
      { text: "Compounding yields massive long-term gains.", citations: ["H1"] },
      { text: "Four laws framework guides behavior change.", citations: ["H2"] },
      { text: "Environment beats willpower consistently.", citations: ["H3"] },
      { text: "Two-Minute Rule lowers activation barriers.", citations: ["H4"] },
      { text: "Identity shifts drive lasting habits.", citations: ["H6"] },
    ]}).success).toBe(true);
  });
  it("fails with 4", () => {
    expect(validateOutput({ mode: "interview", items: [
      { text: "A.", citations: ["H1"] }, { text: "B.", citations: ["H2"] },
      { text: "C.", citations: ["H3"] }, { text: "D.", citations: ["H4"] },
    ]}).success).toBe(false);
  });
  it("fails bullet >18 words", () => {
    expect(validateOutput({ mode: "interview", items: [
      { text: "This is way too many words and exceeds eighteen word limit for interview bullets set by the validator.", citations: ["H1"] },
      { text: "Short.", citations: ["H2"] }, { text: "Short.", citations: ["H3"] },
      { text: "Short.", citations: ["H4"] }, { text: "Short.", citations: ["H5"] },
    ]}).success).toBe(false);
  });
});

// ━━━ kidFriendly ━━━ (≤120 words, 2–4 items, analogy required)
describe("kidFriendly", () => {
  it("passes with analogy", () => {
    expect(validateOutput({ mode: "kidFriendly", items: [
      { text: "Imagine habits are like building blocks.", citations: ["H1"] },
      { text: "Four tricks make habits stick.", citations: ["H2"] },
    ]}).success).toBe(true);
  });
  it("fails without analogy", () => {
    expect(validateOutput({ mode: "kidFriendly", items: [
      { text: "Habits grow slowly.", citations: ["H1"] },
      { text: "They eventually work.", citations: ["H7"] },
    ]}).success).toBe(false);
  });
  it("fails >120 words", () => {
    expect(validateOutput({ mode: "kidFriendly", items: [
      { text: "Imagine " + Array(125).fill("word").join(" "), citations: ["H1"] },
      { text: "Second.", citations: ["H2"] },
    ]}).success).toBe(false);
  });
});

// ━━━ citations ━━━
describe("citations", () => {
  it("valid", () => {
    expect(validateCitations({ mode: "oneMinute", items: [
      { text: "T.", citations: ["H1", "H3"] }, { text: "T.", citations: ["H5"] },
      { text: "T.", citations: ["H6"] },
    ]}, HL).valid).toBe(true);
  });
  it("missing", () => {
    const r = validateCitations({ mode: "oneMinute", items: [
      { text: "T.", citations: ["H99"] }, { text: "T.", citations: ["H1"] },
      { text: "T.", citations: ["H2"] },
    ]}, HL);
    expect(r.valid).toBe(false);
    expect(r.missing).toContain("H99");
  });
});

// ━━━ metrics ━━━
describe("metrics", () => {
  it("computes correctly", () => {
    const m = computeMetrics({ mode: "oneMinute", items: [
      { text: "First point here.", citations: ["H1", "H2"] },
      { text: "Second point here.", citations: ["H3"] },
      { text: "Third point here.", citations: ["H4"] },
    ]}, HL);
    expect(m.wordCount).toBe(9);
    expect(m.wordLimitPass).toBe(true);
    expect(m.schemaPass).toBe(true);
  });
});

// ━━━ cosine similarity ━━━
describe("cosineSimilarity", () => {
  it("identical = 1", () => { expect(cosineSimilarity([1,2,3], [1,2,3])).toBeCloseTo(1); });
  it("orthogonal = 0", () => { expect(cosineSimilarity([1,0,0], [0,1,0])).toBeCloseTo(0); });
  it("opposite = -1", () => { expect(cosineSimilarity([1,2,3], [-1,-2,-3])).toBeCloseTo(-1); });
});

// ━━━ support field ━━━
describe("support field", () => {
  it("accepts direct", () => {
    expect(validateOutput({ mode: "oneMinute", items: [
      { text: "A.", citations: ["H1"], support: "direct" },
      { text: "B.", citations: ["H2"], support: "direct" },
      { text: "C.", citations: ["H3"], support: "direct" },
    ]}).success).toBe(true);
  });
  it("accepts inferred", () => {
    expect(validateOutput({ mode: "oneMinute", items: [
      { text: "A.", citations: ["H1"], support: "direct" },
      { text: "B.", citations: ["H2"], support: "inferred" },
      { text: "C.", citations: ["H3"], support: "direct" },
    ]}).success).toBe(true);
  });
});
