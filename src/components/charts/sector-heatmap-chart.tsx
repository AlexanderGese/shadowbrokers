"use client";

import { useEffect, useState } from "react";

interface SectorData {
  name: string;
  bullishPct: number;
  bearishPct: number;
  tickerCount: number;
  score: number;
  avgConfidence: number;
  tickers: string[];
}

export function SectorHeatmapChart() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/charts/heatmap")
      .then((r) => r.json())
      .then((d) => setSectors(d.sectors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="text-[10px] text-muted tracking-widest">LOADING HEATMAP...</span>
      </div>
    );
  }

  if (!sectors.length) {
    return (
      <div className="h-64 flex items-center justify-center">
        <span className="text-[10px] text-muted">No sector data available</span>
      </div>
    );
  }

  function getColor(score: number): string {
    if (score > 0.5) return "#00ff88";
    if (score > 0.2) return "#00cc66";
    if (score > 0) return "#338855";
    if (score > -0.2) return "#885533";
    if (score > -0.5) return "#cc4422";
    return "#ff4444";
  }

  function getBgOpacity(score: number): number {
    return Math.min(0.3, Math.abs(score) * 0.4 + 0.1);
  }

  const selectedSector = sectors.find((s) => s.name === selected);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 p-4">
        {sectors.map((s) => {
          const color = getColor(s.score);
          const opacity = getBgOpacity(s.score);
          return (
            <button
              key={s.name}
              onClick={() => setSelected(selected === s.name ? null : s.name)}
              className={`p-3 border transition-all text-left ${
                selected === s.name
                  ? "border-accent"
                  : "border-card-border hover:border-card-border/60"
              }`}
              style={{ backgroundColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}` }}
            >
              <div className="text-[9px] text-foreground font-bold tracking-wider truncate">
                {s.name}
              </div>
              <div className="text-[18px] font-bold mt-1" style={{ color }}>
                {s.score > 0 ? "+" : ""}{Math.round(s.score * 100)}
              </div>
              <div className="text-[8px] text-muted mt-1">
                {s.tickerCount} TICKER{s.tickerCount !== 1 ? "S" : ""}
              </div>
              <div className="flex gap-2 mt-1">
                <span className="text-[8px] text-bullish">{s.bullishPct}% B</span>
                <span className="text-[8px] text-bearish">{s.bearishPct}% R</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedSector && (
        <div className="mx-4 mb-4 p-3 border border-accent/30 bg-accent/5">
          <div className="text-[10px] text-accent tracking-widest mb-2">{selectedSector.name} TICKERS</div>
          <div className="flex flex-wrap gap-1">
            {selectedSector.tickers.map((t) => (
              <a
                key={t}
                href={`/ticker/${t}`}
                className="text-[10px] px-2 py-1 bg-card-bg border border-card-border text-foreground hover:text-accent hover:border-accent/30 transition-colors"
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
