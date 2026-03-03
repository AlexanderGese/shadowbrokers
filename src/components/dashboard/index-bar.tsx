"use client";

import { useEffect, useState } from "react";

interface IndexData {
  ticker: string;
  name: string;
  currentPrice: number | null;
  changePercent: number | null;
}

export function IndexBar() {
  const [indices, setIndices] = useState<IndexData[]>([]);

  useEffect(() => {
    function fetchIndices() {
      fetch("/api/indices")
        .then((r) => r.json())
        .then((d) => setIndices(d.indices || []))
        .catch(() => {});
    }

    fetchIndices();
    const interval = setInterval(fetchIndices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (indices.length === 0) return null;

  return (
    <div className="border-b border-card-border bg-card-bg/50 px-4 py-1.5 overflow-x-auto">
      <div className="flex items-center gap-4 md:gap-6 text-[10px] min-w-max">
        {indices.map((idx, i) => (
          <span key={idx.ticker} className="flex items-center gap-2">
            {i > 0 && <span className="text-card-border">|</span>}
            <span className="text-muted tracking-wider">{idx.name}</span>
            {idx.currentPrice !== null && (
              <span className="text-foreground font-bold">
                ${idx.currentPrice.toFixed(2)}
              </span>
            )}
            {idx.changePercent !== null && (
              <span className={idx.changePercent >= 0 ? "text-bullish" : "text-bearish"}>
                {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
