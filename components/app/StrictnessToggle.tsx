"use client";

import React from "react";
import { Shield, Scale } from "lucide-react";

export type StrictnessLevel = "strict" | "balanced";

interface Props {
  value: StrictnessLevel;
  onChange: (level: StrictnessLevel) => void;
}

export function StrictnessToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange("strict")}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
          value === "strict"
            ? "bg-primary/10 text-primary border border-primary/20"
            : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`}
        title="Only include claims directly supported by highlights. Remove unsupported items."
      >
        <Shield className="w-3 h-3" />
        Strict
      </button>
      <button
        onClick={() => onChange("balanced")}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
          value === "balanced"
            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
            : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`}
        title="Allow mild inference from highlights. Inferred claims are labeled."
      >
        <Scale className="w-3 h-3" />
        Balanced
      </button>
    </div>
  );
}
