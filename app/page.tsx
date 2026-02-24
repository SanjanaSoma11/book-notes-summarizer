"use client";

import React, { useState, useCallback, useRef } from "react";
import { Zap, Loader2, BookOpenCheck, BarChart3, Database, LayoutGrid } from "lucide-react";

import { normalizeNotes } from "@/lib/normalizer";
import { MODES, type Mode, type Highlight, type OutputItem, type RunMetrics } from "@/lib/schema";
import { addRunToNoteSet, type SavedNoteSet } from "@/lib/storage";

import { Button } from "@/components/ui/button";
import { NotesPanel } from "@/components/app/NotesPanel";
import { ModeSelector } from "@/components/app/ModeSelector";
import { HighlightsDrawer } from "@/components/app/HighlightsDrawer";
import { OutputPanel } from "@/components/app/OutputPanel";
import { ApiStatus } from "@/components/app/ApiStatus";
import { NoteSetManager } from "@/components/app/NoteSetManager";
import { EvalDashboard } from "@/components/app/EvalDashboard";
import { ComparisonView } from "@/components/app/ComparisonView";
import { StrictnessToggle, type StrictnessLevel } from "@/components/app/StrictnessToggle";

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
  const [allResults, setAllResults] = useState<Record<Mode, ResultData | null>>({
    oneMinute: null, technical: null, kidFriendly: null, interview: null,
  });
  const [completedModes, setCompletedModes] = useState<Set<Mode>>(new Set());
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [activeNoteSetId, setActiveNoteSetId] = useState<string | null>(null);
  const [useRAG, setUseRAG] = useState(true);
  const [retrievalInfo, setRetrievalInfo] = useState<{ totalHighlights: number; retrievedCount: number } | null>(null);
  const [showEval, setShowEval] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [strictness, setStrictness] = useState<StrictnessLevel>("strict");
  const [generateAll, setGenerateAll] = useState(false);
  const [activeCitation, setActiveCitation] = useState<string | null>(null);

  const rawInputRef = useRef(rawInput);
  rawInputRef.current = rawInput;

  React.useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) { setError(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const handleNotesChange = useCallback((text: string) => {
    setRawInput(text);
    setHighlights(normalizeNotes(text));
    if (!text.trim()) {
      setResult(null);
      setAllResults({ oneMinute: null, technical: null, kidFriendly: null, interview: null });
      setCompletedModes(new Set());
      setRetrievalInfo(null);
      setError(null);
    }
  }, []);

  const handleLoadNoteSet = (ns: SavedNoteSet) => {
    setRawInput(ns.rawText);
    setHighlights(ns.highlights);
    setActiveNoteSetId(ns.id);
    if (ns.runs.length > 0) {
      const lastRun = ns.runs[ns.runs.length - 1];
      setResult({ mode: lastRun.mode, items: lastRun.items, warnings: lastRun.warnings, metrics: lastRun.metrics });
      setCompletedModes(new Set(ns.runs.map((r) => r.mode)));
      const restored: Record<Mode, ResultData | null> = { oneMinute: null, technical: null, kidFriendly: null, interview: null };
      ns.runs.forEach((r) => { restored[r.mode] = { mode: r.mode, items: r.items, warnings: r.warnings, metrics: r.metrics }; });
      setAllResults(restored);
    }
  };

  const generateOne = async (mode: Mode): Promise<ResultData | null> => {
    const currentInput = rawInputRef.current;
    if (!currentInput.trim()) { setError("No notes to generate from. Paste some text first."); return null; }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, notesText: currentInput, useRAG, strictness }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) { setRateLimitCountdown(30); setError("Rate limit reached. Retrying in 30s…"); return null; }
        setError(data.error + (data.help ? `\n\n${data.help}` : "")); return null;
      }
      const rd: ResultData = { mode: data.mode, items: data.items, warnings: data.warnings, metrics: data.metrics };
      if (data.retrieval) setRetrievalInfo(data.retrieval);
      if (activeNoteSetId) { try { addRunToNoteSet(activeNoteSetId, { mode: data.mode, items: data.items, warnings: data.warnings, metrics: data.metrics, timestamp: data.timestamp }); } catch {} }
      return rd;
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Network error"); return null; }
  };

  const handleGenerate = async () => {
    const currentInput = rawInputRef.current;
    if (!currentInput.trim() || normalizeNotes(currentInput).length === 0) { setError("No notes to generate from. Paste some text first."); return; }
    setLoading(true); setError(null); setRetrievalInfo(null);
    if (generateAll) {
      for (const mode of MODES) {
        const rd = await generateOne(mode);
        if (rd) { setAllResults((prev) => ({ ...prev, [mode]: rd })); setCompletedModes((prev) => new Set([...prev, mode])); if (mode === activeMode) setResult(rd); }
        if (rateLimitCountdown > 0) break;
      }
    } else {
      const rd = await generateOne(activeMode);
      if (rd) { setResult(rd); setAllResults((prev) => ({ ...prev, [activeMode]: rd })); setCompletedModes((prev) => new Set([...prev, activeMode])); }
    }
    setLoading(false);
  };

  const canGenerate = rawInput.trim().length > 0 && highlights.length > 0 && !loading && rateLimitCountdown === 0;
  const completedCount = Object.values(allResults).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 border-glow"><BookOpenCheck className="w-4 h-4 text-primary" /></div>
            <span className="font-display text-xl tracking-tight text-foreground">BookNotes</span>
          </div>
          <div className="flex items-center gap-1">
            {completedCount > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setShowComparison(true)} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                <LayoutGrid className="w-3.5 h-3.5" /> Compare ({completedCount})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowEval(true)} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <BarChart3 className="w-3.5 h-3.5" /> Eval
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-[calc(100vh-8rem)]">
          <div className="flex flex-col gap-3 min-h-0">
            <ApiStatus />
            <div className="flex-1 min-h-0"><NotesPanel value={rawInput} onChange={handleNotesChange} highlightCount={highlights.length} /></div>
            <HighlightsDrawer highlights={highlights} />
            <NoteSetManager rawInput={rawInput} highlights={highlights} onLoad={handleLoadNoteSet} />
            <ModeSelector value={activeMode} onChange={(m) => { setActiveMode(m); if (allResults[m]) setResult(allResults[m]); }} completedModes={completedModes} />
            <div className="flex items-center gap-2 flex-wrap">
              <StrictnessToggle value={strictness} onChange={setStrictness} />
              <button onClick={() => setUseRAG(!useRAG)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${useRAG ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/40 text-muted-foreground"}`}>
                <Database className="w-3 h-3" /> RAG
              </button>
              <button onClick={() => setGenerateAll(!generateAll)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${generateAll ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/40 text-muted-foreground"}`}>
                <LayoutGrid className="w-3 h-3" /> All modes
              </button>
              {retrievalInfo && <span className="text-[10px] text-muted-foreground ml-auto">{retrievalInfo.retrievedCount}/{retrievalInfo.totalHighlights} retrieved</span>}
            </div>
            <Button variant="glow" size="lg" className="w-full h-12 text-sm font-semibold gap-2 rounded-xl" disabled={!canGenerate} onClick={handleGenerate}>
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Generating{generateAll ? " all modes" : ""}…</>) : rateLimitCountdown > 0 ? (<><Loader2 className="w-4 h-4 animate-spin" />Retry in {rateLimitCountdown}s</>) : (<><Zap className="w-4 h-4" />{generateAll ? "Generate All 4 Modes" : "Generate Summary"}</>)}
            </Button>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 whitespace-pre-wrap">{error}</div>}
          </div>
          <div className="min-h-0 overflow-hidden rounded-2xl border border-border/30 bg-card/40 p-5 border-glow">
            <OutputPanel result={result} highlights={highlights} strictness={strictness} onCitationClick={setActiveCitation} />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/30 py-3">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between text-[11px] text-muted-foreground/50">
          <span>Next.js + Groq + HuggingFace + Zod</span>
          <span>RAG-powered · schema-validated · citation-grounded</span>
        </div>
      </footer>

      <EvalDashboard open={showEval} onClose={() => setShowEval(false)} />
      <ComparisonView open={showComparison} onClose={() => setShowComparison(false)} results={allResults} highlights={highlights} />
    </div>
  );
}
