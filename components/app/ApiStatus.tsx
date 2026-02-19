"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, ExternalLink } from "lucide-react";

interface HealthData {
  ok: boolean;
  model?: string;
  error?: string;
}

export function ApiStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState(true);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({ ok: false, error: "Cannot reach app server." });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Checking Groq connection…
      </div>
    );
  }

  if (!health) return null;

  if (health.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
        <Wifi className="w-3 h-3" />
        <span>
          Groq connected{" "}
          <span className="font-mono opacity-70">
            · {health.model || "llama-3.3-70b"}
          </span>
        </span>
        <button
          onClick={check}
          className="ml-auto hover:text-emerald-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 space-y-2">
      <div className="flex items-center gap-2">
        <WifiOff className="w-3 h-3 shrink-0" />
        <span className="font-medium">Groq not connected</span>
        <button
          onClick={check}
          className="ml-auto hover:text-red-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <p className="text-red-400/80 leading-relaxed">{health.error}</p>
      <div className="pt-1 border-t border-red-500/10 text-red-400/60 space-y-1">
        <p className="font-medium text-red-400/80">Quick fix:</p>
        <p>
          1. Get a free key at{" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-flex items-center gap-0.5"
          >
            console.groq.com/keys <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </p>
        <p>
          2. Add to{" "}
          <span className="font-mono bg-red-500/10 px-1 rounded">
            .env.local
          </span>
          :{" "}
          <span className="font-mono bg-red-500/10 px-1 rounded">
            GROQ_API_KEY=gsk_your_key
          </span>
        </p>
        <p>3. Restart the dev server</p>
      </div>
    </div>
  );
}
