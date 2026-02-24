/**
 * Client-side persistence using localStorage.
 *
 * Stores:
 * - Note sets (title, raw text, highlights)
 * - Run history per note set (mode, output, metrics)
 * - Eval metrics across all runs
 */

import { Highlight, Mode, OutputItem, RunMetrics } from "./schema";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SavedRun {
  id: string;
  mode: Mode;
  items: OutputItem[];
  warnings: string[];
  metrics: RunMetrics;
  timestamp: string;
}

export interface SavedNoteSet {
  id: string;
  title: string;
  rawText: string;
  highlights: Highlight[];
  runs: SavedRun[];
  createdAt: string;
  updatedAt: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORAGE KEYS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STORAGE_KEY = "booknotes_notesets";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CRUD OPERATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getAllNoteSets(): SavedNoteSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllNoteSets(sets: SavedNoteSet[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function saveNoteSet(
  title: string,
  rawText: string,
  highlights: Highlight[]
): SavedNoteSet {
  const sets = getAllNoteSets();
  const now = new Date().toISOString();
  const noteSet: SavedNoteSet = {
    id: generateId(),
    title,
    rawText,
    highlights,
    runs: [],
    createdAt: now,
    updatedAt: now,
  };
  sets.unshift(noteSet);
  saveAllNoteSets(sets);
  return noteSet;
}

export function getNoteSet(id: string): SavedNoteSet | null {
  return getAllNoteSets().find((ns) => ns.id === id) ?? null;
}

export function deleteNoteSet(id: string): void {
  const sets = getAllNoteSets().filter((ns) => ns.id !== id);
  saveAllNoteSets(sets);
}

export function addRunToNoteSet(noteSetId: string, run: Omit<SavedRun, "id">): SavedRun {
  const sets = getAllNoteSets();
  const idx = sets.findIndex((ns) => ns.id === noteSetId);
  if (idx === -1) throw new Error("Note set not found");

  const savedRun: SavedRun = { ...run, id: generateId() };
  sets[idx].runs.push(savedRun);
  sets[idx].updatedAt = new Date().toISOString();
  saveAllNoteSets(sets);
  return savedRun;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AGGREGATE STATS (for eval dashboard)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AggregateStats {
  totalNoteSets: number;
  totalRuns: number;
  passRate: number;
  avgCoverage: number;
  avgWordCount: number;
  wordLimitPassRate: number;
  runsByMode: Record<Mode, { count: number; passCount: number }>;
  recentRuns: SavedRun[];
  failureReasons: { reason: string; count: number }[];
}

export function getAggregateStats(): AggregateStats {
  const sets = getAllNoteSets();
  const allRuns = sets.flatMap((ns) => ns.runs);
  const total = allRuns.length;

  if (total === 0) {
    return {
      totalNoteSets: sets.length,
      totalRuns: 0,
      passRate: 0,
      avgCoverage: 0,
      avgWordCount: 0,
      wordLimitPassRate: 0,
      runsByMode: {
        oneMinute: { count: 0, passCount: 0 },
        technical: { count: 0, passCount: 0 },
        kidFriendly: { count: 0, passCount: 0 },
        interview: { count: 0, passCount: 0 },
      },
      recentRuns: [],
      failureReasons: [],
    };
  }

  const passed = allRuns.filter((r) => r.metrics.schemaPass).length;
  const wordPassed = allRuns.filter((r) => r.metrics.wordLimitPass).length;
  const totalCoverage = allRuns.reduce((s, r) => s + r.metrics.citationCoverage, 0);
  const totalWords = allRuns.reduce((s, r) => s + r.metrics.wordCount, 0);

  // By mode
  const runsByMode: Record<Mode, { count: number; passCount: number }> = {
    oneMinute: { count: 0, passCount: 0 },
    technical: { count: 0, passCount: 0 },
    kidFriendly: { count: 0, passCount: 0 },
    interview: { count: 0, passCount: 0 },
  };
  for (const run of allRuns) {
    runsByMode[run.mode].count++;
    if (run.metrics.schemaPass) runsByMode[run.mode].passCount++;
  }

  // Failure reasons
  const failures: string[] = [];
  for (const run of allRuns) {
    if (!run.metrics.schemaPass) failures.push("Schema validation failed");
    if (!run.metrics.wordLimitPass) failures.push("Word limit exceeded");
    if (!run.metrics.validCitations) failures.push("Invalid citations");
    if (run.metrics.citationCoverage < 30) failures.push("Low citation coverage (<30%)");
  }
  const failureMap: Record<string, number> = {};
  for (const f of failures) failureMap[f] = (failureMap[f] || 0) + 1;
  const failureReasons = Object.entries(failureMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // Recent runs (last 20)
  const recentRuns = [...allRuns]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return {
    totalNoteSets: sets.length,
    totalRuns: total,
    passRate: Math.round((passed / total) * 100),
    avgCoverage: Math.round(totalCoverage / total),
    avgWordCount: Math.round(totalWords / total),
    wordLimitPassRate: Math.round((wordPassed / total) * 100),
    runsByMode,
    recentRuns,
    failureReasons,
  };
}
