"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3, CheckCircle2, XCircle, TrendingUp,
  AlertTriangle, X, RefreshCw, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODE_META, type Mode } from "@/lib/schema";
import { getAggregateStats, type AggregateStats } from "@/lib/storage";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EvalDashboard({ open, onClose }: Props) {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (open) setStats(getAggregateStats());
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Eval Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats?.totalRuns ?? 0} runs across {stats?.totalNoteSets ?? 0} note sets
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStats(getAggregateStats())} className="gap-1.5 text-xs">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>

        {!stats || stats.totalRuns === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No runs yet. Generate some summaries and save note sets to see eval data.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Use the "Save Note Set" button after generating.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Pass Rate" value={`${stats.passRate}%`} detail={`${stats.totalRuns} total runs`} color="emerald" icon={<CheckCircle2 className="w-4 h-4" />} />
              <StatCard label="Avg Coverage" value={`${stats.avgCoverage}%`} detail="citation coverage" color="blue" icon={<TrendingUp className="w-4 h-4" />} />
              <StatCard label="Word Limit" value={`${stats.wordLimitPassRate}%`} detail="within limits" color="violet" icon={<CheckCircle2 className="w-4 h-4" />} />
              <StatCard label="Avg Words" value={`${stats.avgWordCount}`} detail="per summary" color="amber" icon={<BarChart3 className="w-4 h-4" />} />
            </div>

            {/* Mode Breakdown */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-foreground mb-3">Runs by Mode</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(stats.runsByMode) as Mode[]).map((mode) => {
                  const data = stats.runsByMode[mode];
                  return (
                    <div key={mode} className="p-4 rounded-xl bg-card border border-border/40">
                      <div className="text-xs text-muted-foreground mb-1">{MODE_META[mode].icon} {MODE_META[mode].label}</div>
                      <div className="text-2xl font-bold text-foreground">{data.count}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {data.count > 0 ? (
                          <>
                            <span className={`w-1.5 h-1.5 rounded-full ${data.passCount === data.count ? "bg-emerald-500" : "bg-amber-500"}`} />
                            <span className="text-[10px] text-muted-foreground">{data.passCount}/{data.count} passed</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40">No runs</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Failure Reasons */}
            {stats.failureReasons.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Common Failure Reasons
                </h2>
                <div className="space-y-1.5">
                  {stats.failureReasons.map(({ reason, count }) => (
                    <div key={reason} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/40">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-sm text-foreground">{reason}</span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Runs */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Recent Runs</h2>
              <div className="space-y-1">
                {stats.recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border/40">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${run.metrics.schemaPass ? "bg-emerald-500" : "bg-red-400"}`} />
                    <span className="text-xs font-medium text-foreground w-24">{MODE_META[run.mode].icon} {MODE_META[run.mode].label}</span>
                    <span className="text-xs text-muted-foreground w-20">{run.metrics.wordCount} words</span>
                    <span className="text-xs text-muted-foreground w-20">{run.metrics.citationCoverage}% cov</span>
                    <span className="text-xs text-muted-foreground w-16">{run.metrics.itemCount} items</span>
                    <span className={`text-xs ml-auto ${run.metrics.schemaPass ? "text-emerald-500" : "text-red-400"}`}>
                      {run.metrics.schemaPass ? "PASS" : "FAIL"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, detail, color, icon }: {
  label: string; value: string; detail: string;
  color: "emerald" | "blue" | "violet" | "amber";
  icon: React.ReactNode;
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    violet: "bg-violet-500/10 text-violet-500",
    amber: "bg-amber-500/10 text-amber-500",
  };
  return (
    <div className="p-4 rounded-xl bg-card border border-border/40">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${colors[color]}`}>{icon}</div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{detail}</div>
    </div>
  );
}
