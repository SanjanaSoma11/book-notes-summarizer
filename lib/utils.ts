import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OutputItem, Highlight } from "./schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toMarkdown(
  title: string,
  modeLabel: string,
  items: OutputItem[],
  highlights: Highlight[]
): string {
  const map = new Map(highlights.map((h) => [h.highlightId, h.text]));
  let md = `# ${title}\n**Mode:** ${modeLabel}\n\n---\n\n`;
  items.forEach((item, i) => {
    const prefix = items.length > 1 ? `${i + 1}. ` : "";
    md += `${prefix}${item.text} [${item.citations.join(", ")}]\n\n`;
  });
  md += `---\n\n## Cited Highlights\n\n`;
  const cited = new Set(items.flatMap((i) => i.citations));
  cited.forEach((id) => {
    const t = map.get(id);
    if (t) md += `**${id}:** ${t}\n\n`;
  });
  return md;
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
