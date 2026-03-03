"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardHeader({ lastUpdated }: { lastUpdated: string | null }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function triggerAnalysis() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatus(`Fetched ${data.rss.fetched} articles, created ${data.analysis.insights} insights`);
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="border-b border-card-border bg-card-bg px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-bullish pulse-dot" />
            <h1 className="text-lg font-bold tracking-widest text-foreground">
              SHADOWBROKERS
            </h1>
          </div>
          <span className="text-xs text-muted">FINANCIAL INTELLIGENCE TERMINAL</span>
        </div>

        <div className="flex items-center gap-4">
          {status && (
            <span className="text-xs text-accent">{status}</span>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted">
              LAST UPDATE: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          <button
            onClick={triggerAnalysis}
            disabled={loading}
            className="border border-card-border bg-background px-3 py-1.5 text-xs font-medium text-accent hover:bg-card-bg hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "[ ANALYZING... ]" : "[ RUN ANALYSIS ]"}
          </button>
        </div>
      </div>
    </header>
  );
}
