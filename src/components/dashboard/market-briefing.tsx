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

interface ArchiveItem {
  id: string;
  summary_preview: string;
  market_bias: string;
  danger_count: number;
  generated_at: string;
}

export function MarketBriefing() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedBriefing, setExpandedBriefing] = useState<Briefing | null>(null);
  const [expandLoading, setExpandLoading] = useState(false);

  useEffect(() => {
    fetch("/api/briefing")
      .then((r) => r.json())
      .then((d) => setBriefing(d.briefing || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`/api/briefings?page=${archivePage}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        setArchive(d.briefings || []);
        setArchiveTotal(d.total || 0);
      })
      .catch(() => {});
  }, [archivePage]);

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedBriefing(null);
      return;
    }
    setExpandedId(id);
    setExpandLoading(true);
    fetch(`/api/briefings/${id}`)
      .then((r) => r.json())
      .then((d) => setExpandedBriefing(d.briefing || null))
      .catch(() => {})
      .finally(() => setExpandLoading(false));
  }

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
        <div className="px-6 py-4 border-b border-card-border">
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

      {/* Archive */}
      {archive.length > 0 && (
        <div>
          <div className="px-4 py-2 border-b border-card-border">
            <span className="text-[10px] text-muted tracking-widest">BRIEFING ARCHIVE ({archiveTotal})</span>
          </div>
          <div className="divide-y divide-card-border">
            {archive.map((item) => {
              const bColor =
                item.market_bias === "bullish" ? "text-bullish bg-bullish/10" :
                item.market_bias === "bearish" ? "text-bearish bg-bearish/10" :
                "text-neutral bg-neutral/10";
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full px-6 py-2.5 flex items-center justify-between text-left hover:bg-card-border/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted">
                        {new Date(item.generated_at).toLocaleDateString()}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider ${bColor}`}>
                        {item.market_bias}
                      </span>
                      {item.danger_count > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 font-bold text-bearish bg-bearish/10">
                          {item.danger_count} DANGER
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted">{isExpanded ? "COLLAPSE" : "EXPAND"}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4">
                      {expandLoading ? (
                        <div className="text-[10px] text-muted animate-pulse py-2">LOADING...</div>
                      ) : expandedBriefing ? (
                        <div className="border border-card-border bg-background p-4 space-y-3">
                          <p className="text-xs text-foreground leading-relaxed">{expandedBriefing.summary}</p>
                          {expandedBriefing.key_signals.length > 0 && (
                            <div>
                              <div className="text-[10px] text-muted tracking-widest mb-1">KEY SIGNALS</div>
                              {expandedBriefing.key_signals.map((signal, i) => (
                                <div key={i} className="text-xs text-foreground">
                                  <span className="text-accent">&gt;</span> {signal}
                                </div>
                              ))}
                            </div>
                          )}
                          {expandedBriefing.danger_tickers.length > 0 && (
                            <div>
                              <div className="text-[10px] text-bearish tracking-widest mb-1">DANGER TICKERS</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {expandedBriefing.danger_tickers.map((dt) => (
                                  <div key={dt.ticker} className="border border-bearish/30 bg-bearish/5 p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-foreground">{dt.ticker}</span>
                                      <span className="text-[9px] text-bearish font-bold">{Math.round(dt.confidence * 100)}%</span>
                                    </div>
                                    <p className="text-[9px] text-muted mt-1">{dt.reasoning}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {archiveTotal > 10 && (
            <div className="px-6 py-2 border-t border-card-border flex items-center justify-between text-[10px]">
              <span className="text-muted">
                PAGE {archivePage} OF {Math.ceil(archiveTotal / 10)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                  disabled={archivePage <= 1}
                  className="px-3 py-1 border border-card-border text-muted hover:text-foreground disabled:opacity-30 tracking-widest"
                >
                  PREV
                </button>
                <button
                  onClick={() => setArchivePage((p) => Math.min(Math.ceil(archiveTotal / 10), p + 1))}
                  disabled={archivePage >= Math.ceil(archiveTotal / 10)}
                  className="px-3 py-1 border border-card-border text-muted hover:text-foreground disabled:opacity-30 tracking-widest"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
