/**
 * RAG-lite Retrieval
 *
 * Before generation, we:
 * 1. Create mode-specific "query plans" (what to look for)
 * 2. Embed queries + highlights
 * 3. Find top-k most relevant highlights per query
 * 4. Merge & dedupe → "allowed evidence set"
 * 5. Only pass those highlights to the LLM
 */

import { Highlight, Mode } from "./schema";
import { generateEmbeddings, cosineSimilarity } from "./embeddings";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY PLANS (what to search for, per mode)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QUERY_PLANS: Record<Mode, string[]> = {
  oneMinute: [
    "main thesis and central argument of the book",
    "key supporting points and evidence",
    "conclusion and final takeaways",
  ],
  technical: [
    "frameworks, models, and formal definitions",
    "mechanisms, processes, and how things work",
    "tradeoffs, limitations, and nuances",
    "technical terminology and precise concepts",
  ],
  kidFriendly: [
    "core idea explained simply",
    "concrete examples and real-world comparisons",
    "analogies, metaphors, and relatable descriptions",
  ],
  interview: [
    "actionable skills and competencies",
    "key insights and unique learnings",
    "professional takeaways and applications",
    "quantifiable outcomes and results",
    "unique perspectives that show expertise",
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RETRIEVAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RetrievalResult {
  evidenceSet: Highlight[];
  totalHighlights: number;
  retrievedCount: number;
  queries: string[];
  scores: { highlightId: string; maxScore: number }[];
}

/**
 * Retrieve the most relevant highlights for a given mode.
 *
 * @param highlights  All parsed highlights
 * @param mode        The summary mode
 * @param topK        Max highlights to retrieve per query (default 5)
 * @param threshold   Minimum similarity score (default 0.15)
 */
export async function retrieveEvidence(
  highlights: Highlight[],
  mode: Mode,
  topK: number = 5,
  threshold: number = 0.15
): Promise<RetrievalResult> {
  const queries = QUERY_PLANS[mode];

  // If few highlights, just return all (no point filtering)
  if (highlights.length <= 6) {
    return {
      evidenceSet: highlights,
      totalHighlights: highlights.length,
      retrievedCount: highlights.length,
      queries,
      scores: highlights.map((h) => ({ highlightId: h.highlightId, maxScore: 1 })),
    };
  }

  // Embed all highlights + all queries in one batch
  const highlightTexts = highlights.map((h) => h.text);
  const allTexts = [...highlightTexts, ...queries];
  const allEmbeddings = await generateEmbeddings(allTexts);

  const hlEmbeddings = allEmbeddings.slice(0, highlights.length);
  const queryEmbeddings = allEmbeddings.slice(highlights.length);

  // For each query, find top-k highlights
  const scoreMap = new Map<string, number>(); // highlightId → max score

  for (const queryEmb of queryEmbeddings) {
    const scored = hlEmbeddings.map((hlEmb, idx) => ({
      id: highlights[idx].highlightId,
      score: cosineSimilarity(queryEmb, hlEmb),
    }));

    scored.sort((a, b) => b.score - a.score);

    for (const item of scored.slice(0, topK)) {
      if (item.score >= threshold) {
        const existing = scoreMap.get(item.id) ?? 0;
        scoreMap.set(item.id, Math.max(existing, item.score));
      }
    }
  }

  // Build evidence set sorted by relevance
  const scores = [...scoreMap.entries()]
    .map(([id, maxScore]) => ({ highlightId: id, maxScore }))
    .sort((a, b) => b.maxScore - a.maxScore);

  const evidenceIds = new Set(scores.map((s) => s.highlightId));
  const evidenceSet = highlights.filter((h) => evidenceIds.has(h.highlightId));

  return {
    evidenceSet,
    totalHighlights: highlights.length,
    retrievedCount: evidenceSet.length,
    queries,
    scores,
  };
}
