"use client";

import { useEffect, useState } from "react";

interface Briefing {
  id: string;
  summary: string;
  danger_tickers: { ticker: string; sentiment: string; confidence: number; reasoning: string }[];
  key_signals: string[];
  market_bias: string;
  generated_at: string;
}

export function MarketBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/briefing")
      .then((r) => r.json())
      .then((d) => setBriefing(d.briefing || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border-b border-card-border p-8 text-center">
        <span className="text-[10px] text-muted tracking-widest">LOADING BRIEFING...</span>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="border-b border-card-border p-8 text-center">
        <div className="text-muted text-xs">
          <span className="text-accent">&gt;</span> No briefing available. Run the analysis pipeline to generate one.
        </div>
      </div>
    );
  }

  const biasColor =
    briefing.market_bias === "bullish"
      ? "text-bullish"
      : briefing.market_bias === "bearish"
        ? "text-bearish"
        : briefing.market_bias === "mixed"
          ? "text-neutral"
          : "text-accent";

  return (
    <div className="border-b border-card-border">
      {/* Header */}
      <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted tracking-widest">MARKET BRIEFING</span>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${biasColor}`}>
            {briefing.market_bias}
          </span>
        </div>
        <span className="text-[9px] text-muted">
          {new Date(briefing.generated_at).toLocaleString()}
        </span>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 border-b border-card-border">
        <div className="text-[10px] text-muted tracking-widest mb-2">SUMMARY</div>
        <p className="text-xs text-foreground leading-relaxed">{briefing.summary}</p>
      </div>

      {/* Key Signals */}
      {briefing.key_signals.length > 0 && (
        <div className="px-6 py-4 border-b border-card-border">
          <div className="text-[10px] text-muted tracking-widest mb-2">KEY SIGNALS</div>
          <div className="space-y-1">
            {briefing.key_signals.map((signal, i) => (
              <div key={i} className="text-xs text-foreground">
                <span className="text-accent">&gt;</span> {signal}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {briefing.danger_tickers.length > 0 && (
        <div className="px-6 py-4">
          <div className="text-[10px] text-bearish tracking-widest mb-3">DANGER ZONE</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {briefing.danger_tickers.map((dt) => (
              <div
                key={dt.ticker}
                className="border border-bearish/30 bg-bearish/5 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-foreground">{dt.ticker}</span>
                  <span className="text-[10px] text-bearish font-bold">
                    {Math.round(dt.confidence * 100)}% CONF
                  </span>
                </div>
                <p className="text-[10px] text-muted leading-relaxed">{dt.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
