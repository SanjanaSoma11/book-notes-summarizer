import { Highlight } from "./schema";

/**
 * Normalize raw text into Highlight[].
 * Paragraphs → highlights. Bullet lists → individual highlights.
 */
export function normalizeNotes(raw: string): Highlight[] {
  if (!raw.trim()) return [];

  const blocks = raw.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  const chunks: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const allBullets = lines.length > 1 && lines.every((l) => /^[-*•]\s|^\d+[.)]\s/.test(l));

    if (allBullets) {
      for (const line of lines) {
        chunks.push(line.replace(/^[-*•]\s|^\d+[.)]\s/, "").trim());
      }
    } else {
      chunks.push(lines.join(" "));
    }
  }

  return chunks
    .filter((t) => t.length >= 3)
    .map((text, i) => ({ highlightId: `H${i + 1}`, text }));
}

export function formatHighlightsForPrompt(highlights: Highlight[]): string {
  return highlights.map((h) => `[${h.highlightId}] ${h.text}`).join("\n\n");
}

export function highlightMap(hl: Highlight[]): Map<string, Highlight> {
  return new Map(hl.map((h) => [h.highlightId, h]));
}
