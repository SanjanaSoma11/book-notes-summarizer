"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, Download, AlertTriangle, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MODE_META, type OutputItem, type Highlight, type RunMetrics, type Mode } from "@/lib/schema";
import { highlightMap } from "@/lib/normalizer";
import { toMarkdown } from "@/lib/utils";

interface ResultData {
  mode: Mode;
  items: OutputItem[];
  warnings: string[];
  metrics: RunMetrics;
}

interface Props {
  result: ResultData | null;
  highlights: Highlight[];
}

export function OutputPanel({ result, highlights }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [citationId, setCitationId] = useState<string | null>(null);
  const hlMap = highlightMap(highlights);

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const downloadMd = () => {
    if (!result) return;
    const md = toMarkdown("Book Notes Summary", MODE_META[result.mode].label, result.items, highlights);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `summary-${result.mode}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <div className="p-4 rounded-2xl bg-muted/20">
          <FileText className="w-10 h-10 text-muted-foreground/25" />
        </div>
        <p className="text-sm text-muted-foreground/50 max-w-[220px] leading-relaxed">
          Paste your notes, pick a mode, and hit <strong className="text-muted-foreground/70">Generate</strong> to see the summary here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            {MODE_META[result.mode].icon} {MODE_META[result.mode].label}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={downloadMd} className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-foreground">
          <Download className="w-3 h-3" />
          Export .md
        </Button>
      </div>

      {result.warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{w}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {result.items.map((item, idx) => (
          <div key={idx} className="group p-4 rounded-xl bg-card/60 border border-border/30 hover:border-border/60 transition-all animate-fade-up" style={{ animationDelay: `${idx * 70}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] leading-relaxed text-foreground flex-1">
                {result.mode === "interview" && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mr-1.5 -mt-0.5">{idx + 1}</span>
                )}
                {item.text}
              </p>
              <button onClick={() => copy(item.text, idx)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
                {copiedIdx === idx ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.citations.map((c) => (
                <button key={c} onClick={() => setCitationId(c)} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-primary/[0.07] text-primary text-[10px] font-mono font-medium hover:bg-primary/15 transition-colors">
                  {c}<ChevronRight className="w-2.5 h-2.5 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5 pt-3 border-t border-border/30 text-xs text-muted-foreground">
        <Pill label="Words" value={result.metrics.wordCount} ok={result.metrics.wordLimitPass} />
        <Pill label="Coverage" value={`${result.metrics.citationCoverage}%`} ok={result.metrics.citationCoverage > 30} />
        <Pill label="Schema" value={result.metrics.schemaPass ? "Pass" : "Fail"} ok={result.metrics.schemaPass} />
      </div>

      <Dialog open={!!citationId} onOpenChange={() => setCitationId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-sm font-mono">{citationId}</span>
              Source Highlight
            </DialogTitle>
            <DialogDescription>Original text from your notes supporting this claim.</DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-sm leading-relaxed">
            {citationId ? hlMap.get(citationId)?.text ?? "Highlight not found" : ""}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pill({ label, value, ok }: { label: string; value: string | number; ok: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-400"}`} />
      {label}: <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
