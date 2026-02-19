"use client";

import React, { useState, useCallback } from "react";
import { Zap, Loader2, BookOpenCheck } from "lucide-react";

import { normalizeNotes } from "@/lib/normalizer";
import {
  type Mode,
  type Highlight,
  type OutputItem,
  type RunMetrics,
} from "@/lib/schema";

import { Button } from "@/components/ui/button";
import { NotesPanel } from "@/components/app/NotesPanel";
import { ModeSelector } from "@/components/app/ModeSelector";
import { HighlightsDrawer } from "@/components/app/HighlightsDrawer";
import { OutputPanel } from "@/components/app/OutputPanel";
import { ApiStatus } from "@/components/app/ApiStatus";

interface ResultData {
  mode: Mode;
  items: OutputItem[];
  warnings: string[];
  metrics: RunMetrics;
}

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [activeMode, setActiveMode] = useState<Mode>("oneMinute");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [completedModes, setCompletedModes] = useState<Set<Mode>>(new Set());
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  React.useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const handleNotesChange = useCallback((text: string) => {
    setRawInput(text);
    setHighlights(normalizeNotes(text));
  }, []);

  const handleGenerate = async () => {
    if (highlights.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: activeMode, notesText: rawInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Generation failed.";
        const help = data.help ? `\n\n${data.help}` : "";
        if (res.status === 429 || errMsg.toLowerCase().includes("rate limit")) {
          setRateLimitCountdown(30);
          setError("Rate limit reached. Auto-retrying in 30 seconds…");
        } else {
          setError(errMsg + help);
        }
        return;
      }

      setResult({
        mode: data.mode,
        items: data.items,
        warnings: data.warnings,
        metrics: data.metrics,
      });
      setHighlights(data.highlights);
      setCompletedModes((prev) => new Set([...prev, data.mode]));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 border-glow">
              <BookOpenCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-xl tracking-tight text-foreground">
              BookNotes
            </span>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md ml-1">
              Groq
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Free · 30 req/min · Llama 3.3 70B · blazing fast
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          <div className="flex flex-col gap-4 min-h-0">
            <ApiStatus />
            <div className="flex-1 min-h-0">
              <NotesPanel
                value={rawInput}
                onChange={handleNotesChange}
                highlightCount={highlights.length}
              />
            </div>
            <HighlightsDrawer highlights={highlights} />
            <ModeSelector
              value={activeMode}
              onChange={setActiveMode}
              completedModes={completedModes}
            />
            <Button
              variant="glow"
              size="lg"
              className="w-full h-12 text-sm font-semibold gap-2 rounded-xl"
              disabled={
                highlights.length === 0 || loading || rateLimitCountdown > 0
              }
              onClick={handleGenerate}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating with Groq…
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rate limited · retry in {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Summary
                </>
              )}
            </Button>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>
          <div className="min-h-0 overflow-hidden rounded-2xl border border-border/30 bg-card/40 p-5 border-glow">
            <OutputPanel result={result} highlights={highlights} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30 py-4">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between text-[11px] text-muted-foreground/50">
          <span>Built with Next.js + Groq + Zod</span>
          <span>Schema-validated · citation-grounded · deploy on Vercel</span>
        </div>
      </footer>
    </div>
  );
}
