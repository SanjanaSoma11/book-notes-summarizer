import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "@/lib/embeddings";
import { QUERY_PLANS } from "@/lib/retrieval";
import { MODES } from "@/lib/schema";

// ━━━━━━ COSINE SIMILARITY ━━━━━━━━━━━━━━━━━━

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it("returns -1 for opposite vectors", () => {
    const a = [1, 2, 3];
    const b = [-1, -2, -3];
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  it("returns 0 for zero vector", () => {
    const a = [0, 0, 0];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("handles different-length vectors gracefully", () => {
    const a = [1, 2];
    const b = [1, 2, 3];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("computes correct similarity for known vectors", () => {
    const a = [1, 0];
    const b = [1, 1];
    // cos(45°) ≈ 0.7071
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.7071, 3);
  });
});

// ━━━━━━ QUERY PLANS ━━━━━━━━━━━━━━━━━━━━━━━━

describe("QUERY_PLANS", () => {
  it("has query plans for all modes", () => {
    for (const mode of MODES) {
      expect(QUERY_PLANS[mode]).toBeDefined();
      expect(QUERY_PLANS[mode].length).toBeGreaterThan(0);
    }
  });

  it("oneMinute focuses on thesis, key points, conclusion", () => {
    const queries = QUERY_PLANS.oneMinute.join(" ").toLowerCase();
    expect(queries).toContain("thesis");
    expect(queries).toContain("key");
    expect(queries).toContain("conclusion");
  });

  it("technical focuses on frameworks and tradeoffs", () => {
    const queries = QUERY_PLANS.technical.join(" ").toLowerCase();
    expect(queries).toContain("framework");
    expect(queries).toContain("tradeoff");
  });

  it("kidFriendly focuses on analogies", () => {
    const queries = QUERY_PLANS.kidFriendly.join(" ").toLowerCase();
    expect(queries).toContain("analog");
  });

  it("interview has 5 queries for 5 bullets", () => {
    expect(QUERY_PLANS.interview.length).toBe(5);
  });
});
