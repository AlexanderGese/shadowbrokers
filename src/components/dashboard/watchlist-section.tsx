"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import type { PriceData } from "@/lib/types";

interface WatchlistTicker {
  ticker: string;
  price?: PriceData;
  sentiment?: string;
}

export function WatchlistSection() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistTicker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function load() {
      try {
        const res = await fetch("/api/watchlist");
        const data = await res.json();
        const watchlist = data.watchlist || [];

        if (watchlist.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const tickers = watchlist.map((w: { ticker: string }) => w.ticker);

        // Fetch prices
        const priceRes = await fetch(`/api/prices?tickers=${tickers.join(",")}`);
        const priceData = await priceRes.json();

        // Fetch sentiment from tickers API
        const tickerRes = await fetch("/api/tickers?limit=100");
        const tickerData = await tickerRes.json();
        const tickerMap = new Map<string, string>();
        for (const t of tickerData.tickers || []) {
          tickerMap.set(t.ticker, t.overall_sentiment);
        }

        setItems(
          tickers.map((t: string) => ({
            ticker: t,
            price: priceData.prices?.[t] || undefined,
            sentiment: tickerMap.get(t),
          }))
        );
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (!user || loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="border-b border-card-border">
      <div className="px-4 py-2 border-b border-card-border">
        <span className="text-[10px] text-muted tracking-widest">YOUR WATCHLIST</span>
      </div>
      <div className="flex gap-px bg-card-border overflow-x-auto">
        {items.map((item) => {
          const sentColor =
            item.sentiment === "bullish" ? "text-bullish" :
            item.sentiment === "bearish" ? "text-bearish" : "text-neutral";
          const changeColor = item.price && item.price.changePercent >= 0 ? "text-bullish" : "text-bearish";

          return (
            <Link
              key={item.ticker}
              href={`/ticker/${item.ticker}`}
              className="bg-card-bg p-3 min-w-[120px] hover:bg-card-border/30 transition-colors"
            >
              <div className="text-xs font-bold text-foreground">{item.ticker}</div>
              {item.price && (
                <>
                  <div className="text-xs text-foreground mt-0.5">
                    ${item.price.currentPrice.toFixed(2)}
                  </div>
                  <div className={`text-[10px] ${changeColor}`}>
                    {item.price.changePercent >= 0 ? "+" : ""}
                    {item.price.changePercent.toFixed(2)}%
                  </div>
                </>
              )}
              {item.sentiment && (
                <div className={`text-[9px] ${sentColor} uppercase mt-0.5`}>
                  {item.sentiment}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
