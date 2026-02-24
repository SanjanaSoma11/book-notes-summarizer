"use client";

import React, { useState } from "react";
import { Download, FileText, Copy, CheckCircle2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODE_META, type OutputItem, type Highlight, type RunMetrics, type Mode } from "@/lib/schema";
import { toMarkdown } from "@/lib/utils";

interface ResultData {
  mode: Mode;
  items: OutputItem[];
  warnings: string[];
  metrics: RunMetrics;
}

interface Props {
  result: ResultData;
  highlights: Highlight[];
}

export function ExportMenu({ result, highlights }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const showCopied = (type: string) => {
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportMarkdown = () => {
    const md = toMarkdown("Book Notes Summary", MODE_META[result.mode].label, result.items, highlights);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `summary-${result.mode}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyNotion = () => {
    let text = `${MODE_META[result.mode].icon} ${MODE_META[result.mode].label}\n\n`;
    result.items.forEach((item, i) => {
      const prefix = result.mode === "interview" ? `${i + 1}. ` : "• ";
      text += `${prefix}${item.text}\n`;
      text += `   Sources: ${item.citations.join(", ")}\n\n`;
    });
    navigator.clipboard.writeText(text);
    showCopied("notion");
  };

  const exportJSON = () => {
    const data = {
      mode: result.mode,
      modeLabel: MODE_META[result.mode].label,
      items: result.items,
      metrics: result.metrics,
      highlights: highlights.filter((h) =>
        result.items.some((item) => item.citations.includes(h.highlightId))
      ),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `summary-${result.mode}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyPlainText = () => {
    const text = result.items.map((item, i) => {
      const prefix = result.mode === "interview" ? `${i + 1}. ` : "";
      return `${prefix}${item.text}`;
    }).join("\n\n");
    navigator.clipboard.writeText(text);
    showCopied("plain");
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={exportMarkdown} className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-foreground" title="Download as Markdown">
        <Download className="w-3 h-3" />.md
      </Button>
      <Button variant="ghost" size="sm" onClick={copyNotion} className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-foreground" title="Copy Notion-ready format">
        {copied === "notion" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <FileText className="w-3 h-3" />}
        Notion
      </Button>
      <Button variant="ghost" size="sm" onClick={exportJSON} className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-foreground" title="Download as JSON">
        <FileJson className="w-3 h-3" />.json
      </Button>
      <Button variant="ghost" size="sm" onClick={copyPlainText} className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-foreground" title="Copy plain text">
        {copied === "plain" ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        Copy
      </Button>
    </div>
  );
}
