import { NextRequest, NextResponse } from "next/server";
import { Highlight, OutputItem } from "@/lib/schema";
import { generateEmbeddings, cosineSimilarity } from "@/lib/embeddings";

export interface FaithfulnessItem {
  itemIndex: number;
  itemText: string;
  citedHighlights: string[];
  similarity: number;
  flagged: boolean;
  reason?: string;
}

export interface EvalResponse {
  results: FaithfulnessItem[];
  summary: {
    totalItems: number;
    flaggedItems: number;
    avgSimilarity: number;
    passRate: number;
  };
}

const THRESHOLD = 0.45;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, highlights } = body as {
      items: OutputItem[];
      highlights: Highlight[];
    };

    if (!items || !highlights) {
      return NextResponse.json({ error: "Missing items or highlights" }, { status: 400 });
    }

    const hlMap = new Map(highlights.map((h) => [h.highlightId, h]));
    const results: FaithfulnessItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Gather cited highlight texts
      const citedTexts = item.citations
        .map((id) => hlMap.get(id)?.text || "")
        .filter((t) => t.length > 0);

      if (citedTexts.length === 0) {
        results.push({
          itemIndex: i,
          itemText: item.text,
          citedHighlights: item.citations,
          similarity: 0,
          flagged: true,
          reason: "No valid cited highlights found",
        });
        continue;
      }

      // Embed: [itemText, combinedCitedText]
      const combinedCited = citedTexts.join(" ");
      const embeddings = await generateEmbeddings([item.text, combinedCited]);
      const sim = cosineSimilarity(embeddings[0], embeddings[1]);

      results.push({
        itemIndex: i,
        itemText: item.text,
        citedHighlights: item.citations,
        similarity: Math.round(sim * 1000) / 1000,
        flagged: sim < THRESHOLD,
        reason:
          sim < THRESHOLD
            ? `Low similarity (${(sim * 100).toFixed(1)}%) — possible unsupported claim`
            : undefined,
      });
    }

    const avgSim =
      results.length > 0
        ? results.reduce((s, r) => s + r.similarity, 0) / results.length
        : 0;
    const flagged = results.filter((r) => r.flagged).length;

    return NextResponse.json({
      results,
      summary: {
        totalItems: results.length,
        flaggedItems: flagged,
        avgSimilarity: Math.round(avgSim * 1000) / 1000,
        passRate: results.length > 0 ? Math.round(((results.length - flagged) / results.length) * 100) : 0,
      },
    } satisfies EvalResponse);
  } catch (err: unknown) {
    console.error("[/api/evaluate]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
