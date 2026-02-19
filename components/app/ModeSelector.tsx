"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MODES, MODE_META, type Mode } from "@/lib/schema";

interface Props {
  value: Mode;
  onChange: (m: Mode) => void;
  completedModes: Set<Mode>;
}

export function ModeSelector({ value, onChange, completedModes }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Mode)}>
      <TabsList className="w-full grid grid-cols-4 h-11 bg-muted/40 rounded-xl p-1 gap-0.5">
        {MODES.map((m) => (
          <TabsTrigger key={m} value={m} className="relative text-xs font-medium gap-1 rounded-lg data-[state=active]:shadow-md transition-all duration-200" title={MODE_META[m].description}>
            <span className="hidden sm:inline">{MODE_META[m].icon}</span>
            {MODE_META[m].label}
            {completedModes.has(m) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
