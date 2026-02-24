"use client";

import React from "react";
import { CheckCircle2, Clock, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODES, MODE_META, type Mode, type OutputItem, type RunMetrics } from "@/lib/schema";
import type { Highlight } from "@/lib/schema";
import { toMarkdown } from "@/lib/utils";

interface ResultData {
  mode: Mode;
  items: OutputItem[];
  warnings: string[];
  metrics: RunMetrics;
}

interface Props {
  open: boolean;
  onClose: () => void;
  results: Record<Mode, ResultData | null>;
  highlights: Highlight[];
}

export function ComparisonView({ open, onClose, results, highlights }: Props) {
  if (!open) return null;

  const completedCount = Object.values(results).filter(Boolean).length;

  const downloadAll = () => {
    let fullMd = "# BookNotes — All Modes Comparison\n\n";
    for (const mode of MODES) {
      const r = results[mode];
      if (!r) continue;
      fullMd += `---\n\n## ${MODE_META[mode].icon} ${MODE_META[mode].label}\n\n`;
      r.items.forEach((item, i) => {
        fullMd += `${r.items.length > 1 ? `${i + 1}. ` : ""}${item.text} [${item.citations.join(", ")}]\n\n`;
      });
      fullMd += `**Metrics:** ${r.metrics.wordCount} words · ${r.metrics.citationCoverage}% coverage · ${r.metrics.schemaPass ? "PASS" : "FAIL"}\n\n`;
    }
    const blob = new Blob([fullMd], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "booknotes-all-modes.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground">Compare All Modes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/4 modes generated</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={downloadAll} className="text-xs gap-1.5" disabled={completedCount === 0}>
              <Download className="w-3 h-3" /> Export All
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {MODES.map((mode) => {
            const r = results[mode];
            return (
              <div key={mode} className="flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden">
                {/* Mode Header */}
                <div className="px-4 py-3 bg-muted/30 border-b border-border/30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {MODE_META[mode].icon} {MODE_META[mode].label}
                  </span>
                  {r ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[400px]">
                  {r ? (
                    r.items.map((item, idx) => (
                      <div key={idx} className="text-xs leading-relaxed text-foreground">
                        {mode === "interview" && (
                          <span className="font-bold text-primary mr-1">{idx + 1}.</span>
                        )}
                        {item.text}
                        <span className="ml-1 text-primary/50 font-mono text-[10px]">
                          [{item.citations.join(",")}]
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground/30 text-center py-12">
                      Not generated yet
                    </div>
                  )}
                </div>

                {/* Metrics Footer */}
                {r && (
                  <div className="px-4 py-2 border-t border-border/30 flex gap-3 text-[10px] text-muted-foreground bg-muted/10">
                    <span>{r.metrics.wordCount}w</span>
                    <span>{r.metrics.citationCoverage}% cov</span>
                    <span className={r.metrics.schemaPass ? "text-emerald-500" : "text-red-400"}>
                      {r.metrics.schemaPass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
