"use client";

import React, { useState } from "react";
import {
  X, BookOpenCheck, ClipboardPaste, MousePointerClick, Zap,
  Clock, Code2, Baby, Briefcase, Database, Shield, Scale,
  LayoutGrid, BarChart3, FileUp, Download, ChevronRight,
  ChevronLeft, Sparkles, ArrowRight, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    id: "welcome",
    icon: <BookOpenCheck className="w-8 h-8 text-primary" />,
    title: "Welcome to BookNotes",
    subtitle: "AI-powered book summary engine with citation grounding",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          BookNotes transforms your book highlights into structured, verifiable summaries. Every claim cites its source — click any citation to verify it against your original notes.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Shield className="w-4 h-4" />, label: "Citation Grounded", desc: "Every claim traces to source" },
            { icon: <Zap className="w-4 h-4" />, label: "4 Summary Modes", desc: "Different audiences, one click" },
            { icon: <Database className="w-4 h-4" />, label: "RAG Retrieval", desc: "Smart evidence selection" },
            { icon: <FileUp className="w-4 h-4" />, label: "PDF Support", desc: "Upload and extract text" },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1 text-primary">{f.icon}<span className="text-xs font-semibold text-foreground">{f.label}</span></div>
              <p className="text-[11px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "step1",
    icon: <ClipboardPaste className="w-8 h-8 text-primary" />,
    title: "Step 1: Add Your Notes",
    subtitle: "Paste text or upload a PDF",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste your book highlights, notes, or key passages into the left panel. Each paragraph automatically becomes a numbered highlight (H1, H2, H3…) that can be cited in the summary.
        </p>
        <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">TIP</span>
            <p className="text-xs text-muted-foreground leading-relaxed">Click <strong className="text-foreground">"Load Sample"</strong> to try it instantly with pre-loaded Atomic Habits notes.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">PDF</span>
            <p className="text-xs text-muted-foreground leading-relaxed">Toggle the <strong className="text-foreground">PDF</strong> button to upload a PDF file. Text is extracted in your browser — nothing is uploaded to a server.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "step2",
    icon: <MousePointerClick className="w-8 h-8 text-primary" />,
    title: "Step 2: Choose a Mode",
    subtitle: "4 modes for different audiences",
    content: (
      <div className="space-y-4">
        <div className="space-y-2">
          {[
            { icon: <Clock className="w-4 h-4" />, mode: "1-Minute", desc: "Quick overview: thesis + key points + conclusion", constraint: "≤120 words, 3–5 items" },
            { icon: <Code2 className="w-4 h-4" />, mode: "Technical", desc: "Deep dive into frameworks, mechanisms, and tradeoffs", constraint: "≤250 words, 4–8 items" },
            { icon: <Baby className="w-4 h-4" />, mode: "Kid-Friendly", desc: "Simple language with analogies a 10-year-old gets", constraint: "≤120 words, must have analogy" },
            { icon: <Briefcase className="w-4 h-4" />, mode: "Interview", desc: "Professional takeaways and insights", constraint: "Exactly 5 bullets, ≤18 words each" },
          ].map((m) => (
            <div key={m.mode} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="shrink-0 mt-0.5 text-primary">{m.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{m.mode}</span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">{m.constraint}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "step3",
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "Step 3: Generate & Verify",
    subtitle: "Click Generate, then explore the output",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Hit the green <strong className="text-primary">Generate Summary</strong> button. The AI produces a structured summary with citations. Every claim includes a clickable reference like <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">H3</span> — click it to see the exact source text.
        </p>
        <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
          <p className="text-xs font-semibold text-foreground">What happens behind the scenes:</p>
          <div className="space-y-2">
            {[
              "Your notes are split into numbered highlights",
              "RAG retrieval finds the most relevant highlights for your mode",
              "Groq (Llama 3.3 70B) generates a JSON summary",
              "Zod validates word limits, item counts, and citations",
              "If validation fails, errors are sent back for auto-repair",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "features",
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "Advanced Features",
    subtitle: "Power tools for deeper analysis",
    content: (
      <div className="space-y-3">
        {[
          { icon: <Scale className="w-4 h-4" />, label: "Strictness Toggle", desc: "\"Strict\" only allows directly supported claims. \"Balanced\" permits mild inference, labeled as such." },
          { icon: <Database className="w-4 h-4" />, label: "RAG Toggle", desc: "When ON, semantic retrieval pre-selects the most relevant highlights before generation. Turn OFF to use all highlights." },
          { icon: <LayoutGrid className="w-4 h-4" />, label: "All Modes", desc: "Generate all 4 summaries in one click. Then use \"Compare\" in the navbar to see them side by side." },
          { icon: <BarChart3 className="w-4 h-4" />, label: "Eval Dashboard", desc: "Track pass rates, citation coverage, and common failures across all your runs." },
          { icon: <Download className="w-4 h-4" />, label: "Export", desc: "Download summaries as Markdown or JSON, or copy plain text to clipboard." },
          { icon: <FileUp className="w-4 h-4" />, label: "PDF Upload", desc: "Upload a PDF to auto-extract text. Click citations to jump to the matching passage." },
        ].map((f) => (
          <div key={f.label} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
            <div className="shrink-0 mt-0.5 p-1.5 rounded-md bg-primary/10 text-primary">{f.icon}</div>
            <div>
              <span className="text-xs font-semibold text-foreground">{f.label}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export function HelpGuide({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border border-border/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 pb-4">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 p-3 rounded-xl bg-primary/10 border-glow">
              {current.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">{current.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{current.subtitle}</p>
            </div>
          </div>

          {/* Step content */}
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            {current.content}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between bg-muted/10">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? "bg-primary w-5" : i < step ? "bg-primary/40" : "bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-xs gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={onClose} className="text-xs gap-1.5 bg-primary text-primary-foreground">
                Get Started <ArrowRight className="w-3 h-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)} className="text-xs gap-1 bg-primary text-primary-foreground">
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: auto-show guide on first visit using localStorage
 */
export function useFirstVisit(): [boolean, () => void, () => void] {
  const KEY = "booknotes_seen_guide";
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(KEY);
    if (!seen) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") localStorage.setItem(KEY, "1");
  };

  const reopen = () => setShow(true);

  return [show, dismiss, reopen];
}
