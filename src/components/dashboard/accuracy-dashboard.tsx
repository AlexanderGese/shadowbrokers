"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AccuracyData {
  overall: { total: number; correct: number; pct: number };
  bySector: { sector: string; total: number; correct: number; pct: number }[];
  byTicker: { ticker: string; total: number; correct: number; pct: number }[];
  trend: { date: string; total: number; correct: number }[];
}

type Range = "7d" | "30d" | "all";

export function AccuracyDashboard() {
  const [data, setData] = useState<AccuracyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("30d");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/accuracy/breakdown?range=${range}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="border-b border-card-border">
      {/* Range toggle */}
      <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
        <span className="text-[10px] text-muted tracking-widest">PREDICTION ACCURACY</span>
        <div className="flex gap-1">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] tracking-widest font-bold border transition-colors ${
                range === r
                  ? "text-accent border-accent bg-accent/5"
                  : "text-muted border-card-border hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center">
          <span className="text-[10px] text-muted tracking-widest animate-pulse">LOADING ACCURACY DATA...</span>
        </div>
      )}

      {!loading && !data && (
        <div className="p-8 text-center text-xs text-muted">
          <span className="text-accent">&gt;</span> No accuracy data available.
        </div>
      )}

      {!loading && data && (
        <>
          {/* Overall accuracy ring */}
          <div className="flex items-center gap-6 px-6 py-5 border-b border-card-border">
            <div className="relative flex-shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="44" fill="none" stroke="currentColor" strokeWidth="4" className="text-card-border" />
                <circle
                  cx="48" cy="48" r="44" fill="none" strokeWidth="4"
                  className="text-accent"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray={`${(data.overall.pct / 100) * 276.5} 276.5`}
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-accent">{data.overall.pct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
              <span className="text-muted tracking-widest">CORRECT</span>
              <span className="text-bullish font-bold">{data.overall.correct}</span>
              <span className="text-muted tracking-widest">INCORRECT</span>
              <span className="text-bearish font-bold">{data.overall.total - data.overall.correct}</span>
              <span className="text-muted tracking-widest">TOTAL</span>
              <span className="text-foreground font-bold">{data.overall.total}</span>
            </div>
          </div>

          {/* Sector accuracy */}
          {data.bySector.length > 0 && (
            <div className="border-b border-card-border">
              <div className="px-4 py-2 border-b border-card-border">
                <span className="text-[10px] text-muted tracking-widest">ACCURACY BY SECTOR</span>
              </div>
              <div className="divide-y divide-card-border">
                {data.bySector.map((s) => (
                  <div key={s.sector} className="px-6 py-2 flex items-center justify-between text-[10px] hover:bg-card-border/10 transition-colors">
                    <span className="text-foreground uppercase font-bold w-32 truncate">{s.sector}</span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="w-40 h-1.5 bg-card-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${s.pct >= 50 ? "bg-bullish" : "bg-bearish"}`}
                          style={{ width: `${Math.min(100, s.pct)}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right font-bold ${s.pct >= 50 ? "text-bullish" : "text-bearish"}`}>
                        {s.pct}%
                      </span>
                      <span className="text-muted w-16 text-right">{s.correct}/{s.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top tickers accuracy */}
          {data.byTicker.length > 0 && (
            <div className="border-b border-card-border">
              <div className="px-4 py-2 border-b border-card-border">
                <span className="text-[10px] text-muted tracking-widest">TOP TICKERS BY PREDICTIONS</span>
              </div>
              <div className="divide-y divide-card-border">
                {data.byTicker.map((t) => (
                  <div key={t.ticker} className="px-6 py-2 flex items-center justify-between text-[10px] hover:bg-card-border/10 transition-colors">
                    <Link href={`/ticker/${t.ticker}`} className="text-foreground font-bold hover:text-accent transition-colors w-20">
                      {t.ticker}
                    </Link>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="w-32 h-1.5 bg-card-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${t.pct >= 50 ? "bg-bullish" : "bg-bearish"}`}
                          style={{ width: `${Math.min(100, t.pct)}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right font-bold ${t.pct >= 50 ? "text-bullish" : "text-bearish"}`}>
                        {t.pct}%
                      </span>
                      <span className="text-muted w-16 text-right">{t.correct}/{t.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily trend bar chart */}
          {data.trend.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-card-border">
                <span className="text-[10px] text-muted tracking-widest">DAILY ACCURACY TREND</span>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-end gap-px" style={{ height: "120px" }}>
                  {(() => {
                    const maxTotal = Math.max(...data.trend.map((d) => d.total), 1);
                    return data.trend.map((d) => {
                      const h = (d.total / maxTotal) * 100;
                      const correctH = d.total > 0 ? (d.correct / d.total) * h : 0;
                      const incorrectH = h - correctH;
                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col justify-end min-w-[3px] group relative"
                          style={{ height: "100%" }}
                        >
                          <div className="bg-bearish/60 rounded-t-sm" style={{ height: `${incorrectH}%` }} />
                          <div className="bg-bullish rounded-b-sm" style={{ height: `${correctH}%` }} />
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card-bg border border-card-border px-2 py-1 text-[9px] text-foreground whitespace-nowrap z-10">
                            {d.date}: {d.correct}/{d.total}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-between text-[9px] text-muted mt-1">
                  <span>{data.trend[0]?.date}</span>
                  <span>{data.trend[data.trend.length - 1]?.date}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-bullish rounded-sm" />
                    <span className="text-muted">CORRECT</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-bearish/60 rounded-sm" />
                    <span className="text-muted">INCORRECT</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
