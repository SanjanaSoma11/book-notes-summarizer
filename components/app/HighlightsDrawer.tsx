"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Hash } from "lucide-react";
import type { Highlight } from "@/lib/schema";

export function HighlightsDrawer({ highlights }: { highlights: Highlight[] }) {
  const [open, setOpen] = useState(false);

  if (highlights.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold">Parsed Highlights</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{highlights.length}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="max-h-52 overflow-y-auto divide-y divide-border/20">
          {highlights.map((h) => (
            <div key={h.highlightId} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted/10 transition-colors">
              <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">{h.highlightId}</span>
              <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{h.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
