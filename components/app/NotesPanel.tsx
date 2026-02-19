"use client";

import React from "react";
import { BookOpen, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const SAMPLE = `The key insight of atomic habits is that small changes compound over time. A 1% improvement each day leads to being 37 times better after one year.

The four laws of behavior change are: make it obvious, make it attractive, make it easy, and make it satisfying. These form the backbone of habit formation.

Environment design is more powerful than willpower. People who appear to have tremendous self-control are actually just better at structuring their environment.

The Two-Minute Rule: when you start a new habit, it should take less than two minutes to do. Scale down any habit to its two-minute version.

Habit stacking works by linking a new habit to an existing one: "After I [CURRENT HABIT], I will [NEW HABIT]." This leverages the neural pathways already formed.

Identity-based habits are more durable than outcome-based habits. Instead of "I want to run a marathon," think "I am a runner." Every action is a vote for the type of person you want to become.

Plateau of Latent Potential: we expect progress to be linear, but habits often show no visible results until a critical threshold is crossed. The most powerful outcomes are delayed.

Breaking bad habits requires inverting the four laws: make it invisible, make it unattractive, make it difficult, and make it unsatisfying.`;

interface Props {
  value: string;
  onChange: (text: string) => void;
  highlightCount: number;
}

export function NotesPanel({ value, onChange, highlightCount }: Props) {
  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Book Notes</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange(SAMPLE)} className="text-xs text-muted-foreground hover:text-primary gap-1.5 h-7">
          <Sparkles className="w-3 h-3" />
          Load Sample
        </Button>
      </div>

      <div className="relative flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"Paste your book notes, highlights, or key passages here…\n\nEach paragraph becomes a citable highlight."}
          spellCheck={false}
          className="w-full h-full resize-none rounded-xl border border-border/50 bg-card/80 p-4 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition-all"
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <FileText className="w-14 h-14 text-muted-foreground/10" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground/70 px-0.5">
        {highlightCount > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {highlightCount} highlight{highlightCount !== 1 && "s"} detected
          </span>
        ) : (
          <span>No highlights yet</span>
        )}
        {value && <span>{value.split(/\s+/).filter(Boolean).length} words</span>}
      </div>
    </div>
  );
}
