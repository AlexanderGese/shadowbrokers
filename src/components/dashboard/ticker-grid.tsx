"use client";

import { useEffect, useState } from "react";
import type { TickerSummary, PriceData } from "@/lib/types";
import { TickerCard } from "./ticker-card";

export function TickerGrid({ tickers }: { tickers: TickerSummary[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});

  useEffect(() => {
    if (tickers.length === 0) return;

    const top = tickers.slice(0, 20).map((t) => t.ticker);
    fetch(`/api/prices?tickers=${top.join(",")}`)
      .then((r) => r.json())
      .then((d) => setPrices(d.prices || {}))
      .catch(() => {});
  }, [tickers]);

  if (tickers.length === 0) {
    return (
      <div className="border border-card-border bg-card-bg p-8 text-center">
        <div className="text-muted text-sm">
          <span className="text-accent">&gt;</span> No ticker data available.
          Run analysis to populate the dashboard.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-2 border-b border-card-border">
        <span className="text-[10px] text-muted tracking-widest">MARKET SIGNALS</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-card-border">
        {tickers.map((ticker) => (
          <TickerCard key={ticker.ticker} ticker={ticker} price={prices[ticker.ticker]} />
        ))}
      </div>
    </div>
  );
}
