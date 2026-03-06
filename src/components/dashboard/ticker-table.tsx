"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { TickerSummary } from "@/lib/types";
import { SentimentSparkline } from "@/components/charts/sentiment-sparkline";

interface TickerTableProps {
  tickers: TickerSummary[];
}

type SortKey = "ticker" | "name" | "sector" | "sentiment" | "confidence" | "articles";
type SortDir = "asc" | "desc";

export function TickerTable({ tickers }: TickerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "stock" | "etf">("all");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "bullish" | "bearish" | "neutral">("all");
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Fetch sparkline data for top tickers
    const topTickers = tickers.slice(0, 20).map(t => t.ticker);
    if (topTickers.length === 0) return;

    Promise.all(
      topTickers.map(ticker =>
        fetch(`/api/charts/sentiment?ticker=${ticker}&range=7d`)
          .then(r => r.json())
          .then(d => {
            const points = (d.data || []).map((p: { bullish: number; bearish: number }) =>
              p.bullish - p.bearish
            );
            return { ticker, points };
          })
          .catch(() => ({ ticker, points: [] as number[] }))
      )
    ).then(results => {
      const map: Record<string, number[]> = {};
      for (const r of results) {
        if (r.points.length >= 2) map[r.ticker] = r.points;
      }
      setSparklines(map);
    });
  }, [tickers]);

  const filtered = tickers.filter((t) => {
    if (filter !== "all" && t.asset_type !== filter) return false;
    if (sentimentFilter !== "all" && t.overall_sentiment !== sentimentFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "ticker": return dir * a.ticker.localeCompare(b.ticker);
      case "name": return dir * (a.name || "").localeCompare(b.name || "");
      case "sector": return dir * (a.sector || "").localeCompare(b.sector || "");
      case "sentiment": {
        const order = { bullish: 0, neutral: 1, bearish: 2 };
        return dir * ((order[a.overall_sentiment as keyof typeof order] ?? 1) - (order[b.overall_sentiment as keyof typeof order] ?? 1));
      }
      case "confidence": return dir * (a.avg_confidence - b.avg_confidence);
      case "articles": return dir * (a.num_articles - b.num_articles);
      default: return 0;
    }
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="border-b border-card-border">
      {/* Table header with filters */}
      <div className="px-4 py-2 border-b border-card-border flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] text-muted tracking-widest">ALL TICKERS ({sorted.length})</span>
        <div className="flex gap-2">
          <div className="flex gap-px">
            {(["all", "stock", "etf"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[9px] px-2 py-1 uppercase tracking-wider border border-card-border transition-colors ${
                  filter === f ? "bg-accent/20 text-accent border-accent/30" : "text-muted hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-px">
            {(["all", "bullish", "bearish", "neutral"] as const).map((f) => {
              const colors = {
                all: filter === f ? "bg-accent/20 text-accent border-accent/30" : "",
                bullish: sentimentFilter === f ? "bg-bullish/20 text-bullish border-bullish/30" : "",
                bearish: sentimentFilter === f ? "bg-bearish/20 text-bearish border-bearish/30" : "",
                neutral: sentimentFilter === f ? "bg-neutral/20 text-neutral border-neutral/30" : "",
              };
              return (
                <button
                  key={f}
                  onClick={() => setSentimentFilter(f)}
                  className={`text-[9px] px-2 py-1 uppercase tracking-wider border border-card-border transition-colors ${
                    colors[f] || "text-muted hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-card-border bg-card-bg">
              <th className="text-left px-3 py-2 text-muted font-medium tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("ticker")}>
                TICKER{sortArrow("ticker")}
              </th>
              <th className="text-left px-3 py-2 text-muted font-medium tracking-wider cursor-pointer hover:text-foreground hidden md:table-cell" onClick={() => toggleSort("name")}>
                NAME{sortArrow("name")}
              </th>
              <th className="text-left px-3 py-2 text-muted font-medium tracking-wider cursor-pointer hover:text-foreground hidden lg:table-cell" onClick={() => toggleSort("sector")}>
                SECTOR{sortArrow("sector")}
              </th>
              <th className="text-left px-3 py-2 text-muted font-medium tracking-wider hidden xl:table-cell">
                TOPIC
              </th>
              <th className="text-left px-3 py-2 text-muted font-medium tracking-wider hidden 2xl:table-cell">
                ABOUT
              </th>
              <th className="text-center px-3 py-2 text-muted font-medium tracking-wider hidden lg:table-cell">
                7D TREND
              </th>
              <th className="text-center px-3 py-2 text-muted font-medium tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("sentiment")}>
                SIGNAL{sortArrow("sentiment")}
              </th>
              <th className="text-center px-3 py-2 text-muted font-medium tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("confidence")}>
                CONF{sortArrow("confidence")}
              </th>
              <th className="text-center px-3 py-2 text-muted font-medium tracking-wider cursor-pointer hover:text-foreground" onClick={() => toggleSort("articles")}>
                ARTS{sortArrow("articles")}
              </th>
              <th className="text-center px-3 py-2 text-muted font-medium tracking-wider hidden sm:table-cell">
                B/N/R
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {sorted.map((t) => {
              const sentColor = t.overall_sentiment === "bullish" ? "text-bullish" : t.overall_sentiment === "bearish" ? "text-bearish" : "text-neutral";
              const sentBg = t.overall_sentiment === "bullish" ? "bg-bullish/10" : t.overall_sentiment === "bearish" ? "bg-bearish/10" : "bg-neutral/10";
              const arrow = t.overall_sentiment === "bullish" ? "▲" : t.overall_sentiment === "bearish" ? "▼" : "◆";

              return (
                <tr key={t.ticker} className="hover:bg-card-border/20 transition-colors group">
                  <td className="px-3 py-2">
                    <Link href={`/ticker/${t.ticker}`} className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground group-hover:text-accent transition-colors">{t.ticker}</span>
                      <span className="text-[9px] text-muted uppercase">{t.asset_type}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted truncate max-w-[180px] hidden md:table-cell">
                    {t.name || "---"}
                  </td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    {t.sector ? (
                      <span className="text-[9px] px-1.5 py-px bg-card-bg text-muted border border-card-border">{t.sector}</span>
                    ) : "---"}
                  </td>
                  <td className="px-3 py-2 hidden xl:table-cell">
                    {t.topic ? (
                      <span className={`text-[9px] px-1.5 py-px ${sentBg} ${sentColor}`}>{t.topic}</span>
                    ) : "---"}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-muted truncate max-w-[220px] hidden 2xl:table-cell">
                    {t.description || "---"}
                  </td>
                  <td className="px-3 py-2 text-center hidden lg:table-cell">
                    {sparklines[t.ticker] ? (
                      <SentimentSparkline
                        points={sparklines[t.ticker]}
                        color={t.overall_sentiment === "bullish" ? "#00ff88" : t.overall_sentiment === "bearish" ? "#ff4444" : "#ffaa00"}
                      />
                    ) : (
                      <span className="text-[9px] text-muted">---</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-px ${sentBg} ${sentColor}`}>
                      {arrow} {t.overall_sentiment}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold ${sentColor}`}>{Math.round(t.avg_confidence * 100)}%</span>
                  </td>
                  <td className="px-3 py-2 text-center text-muted">
                    {t.num_articles}
                  </td>
                  <td className="px-3 py-2 text-center hidden sm:table-cell">
                    <span className="text-bullish">{t.bullish_count}</span>
                    <span className="text-muted">/</span>
                    <span className="text-neutral">{t.neutral_count}</span>
                    <span className="text-muted">/</span>
                    <span className="text-bearish">{t.bearish_count}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
