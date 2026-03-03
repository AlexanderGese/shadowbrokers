"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SentimentTrend } from "@/components/charts/sentiment-trend";
import type { PriceData, TickerSummary } from "@/lib/types";

interface CompareData {
  summary: TickerSummary;
  price: PriceData | null;
}

const GRID_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tickersParam = searchParams.get("tickers") || "";
  const tickers = tickersParam.split(",").filter(Boolean).slice(0, 4);

  const [data, setData] = useState<Map<string, CompareData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [addInput, setAddInput] = useState("");

  useEffect(() => {
    if (tickers.length === 0) { setLoading(false); return; }

    async function load() {
      try {
        const [tickerRes, priceRes] = await Promise.all([
          fetch("/api/tickers?limit=100"),
          fetch(`/api/prices?tickers=${tickers.join(",")}`),
        ]);
        const tickerData = await tickerRes.json();
        const priceData = await priceRes.json();

        const summaryMap = new Map<string, TickerSummary>();
        for (const t of tickerData.tickers || []) {
          summaryMap.set(t.ticker, t);
        }

        const result = new Map<string, CompareData>();
        for (const t of tickers) {
          const summary = summaryMap.get(t);
          if (summary) {
            result.set(t, { summary, price: priceData.prices?.[t] || null });
          }
        }
        setData(result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickersParam]);

  function addTicker(e: React.FormEvent) {
    e.preventDefault();
    const t = addInput.toUpperCase().trim();
    if (!t || tickers.includes(t) || tickers.length >= 4) return;
    const newTickers = [...tickers, t].join(",");
    router.push(`/compare?tickers=${newTickers}`);
    setAddInput("");
  }

  function removeTicker(ticker: string) {
    const newTickers = tickers.filter((t) => t !== ticker).join(",");
    router.push(`/compare?tickers=${newTickers}`);
  }

  const sentColor = (s: string) =>
    s === "bullish" ? "text-bullish" : s === "bearish" ? "text-bearish" : "text-neutral";
  const sentBg = (s: string) =>
    s === "bullish" ? "border-l-bullish" : s === "bearish" ? "border-l-bearish" : "border-l-neutral";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
            &larr; DASHBOARD
          </Link>
          <span className="text-card-border">|</span>
          <span className="text-xs text-muted tracking-widest">COMPARE TICKERS</span>
        </div>
      </header>

      {/* Ticker Selector */}
      <div className="border-b border-card-border bg-card-bg px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {tickers.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs px-2 py-1 border border-accent/30 text-accent">
              {t}
              <button onClick={() => removeTicker(t)} className="text-bearish/50 hover:text-bearish ml-1">✕</button>
            </span>
          ))}
          {tickers.length < 4 && (
            <form onSubmit={addTicker} className="flex items-center">
              <input
                type="text"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value.toUpperCase())}
                placeholder="ADD TICKER"
                className="bg-background border border-card-border px-2 py-1 text-[10px] text-foreground w-24 focus:border-accent focus:outline-none"
              />
            </form>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <span className="text-xs text-muted tracking-widest">LOADING...</span>
        </div>
      ) : tickers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-muted text-xs">
            <span className="text-accent">&gt;</span> Add tickers to compare. Use the input above or visit{" "}
            <span className="text-accent">/compare?tickers=AAPL,MSFT,GOOGL</span>
          </div>
        </div>
      ) : (
        <>
          {/* Side-by-side cards */}
          <div className={`grid grid-cols-1 ${GRID_COLS[Math.min(tickers.length, 4)]} gap-px bg-card-border`}>
            {tickers.map((t) => {
              const d = data.get(t);
              if (!d) {
                return (
                  <div key={t} className="bg-card-bg p-4">
                    <span className="text-xs font-bold text-foreground">{t}</span>
                    <div className="text-[10px] text-muted mt-1">No data available</div>
                  </div>
                );
              }
              const { summary, price } = d;
              return (
                <div key={t} className={`bg-card-bg border-l-2 ${sentBg(summary.overall_sentiment)} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/ticker/${t}`} className="text-sm font-bold text-foreground hover:text-accent">
                      {t}
                    </Link>
                    <span className={`text-[10px] font-bold uppercase ${sentColor(summary.overall_sentiment)}`}>
                      {summary.overall_sentiment}
                    </span>
                  </div>
                  {summary.name && <div className="text-[10px] text-muted mb-2">{summary.name}</div>}

                  {price && (
                    <div className="mb-3">
                      <span className="text-lg font-bold text-foreground">${price.currentPrice.toFixed(2)}</span>
                      <span className={`text-xs ml-2 ${price.changePercent >= 0 ? "text-bullish" : "text-bearish"}`}>
                        {price.changePercent >= 0 ? "+" : ""}{price.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><span className="text-muted">CONF:</span> <span className="text-accent">{Math.round(summary.avg_confidence * 100)}%</span></div>
                    <div><span className="text-muted">ARTS:</span> <span className="text-foreground">{summary.num_articles}</span></div>
                    <div><span className="text-muted">BULL:</span> <span className="text-bullish">{summary.bullish_count}</span></div>
                    <div><span className="text-muted">BEAR:</span> <span className="text-bearish">{summary.bearish_count}</span></div>
                  </div>

                  {summary.sector && (
                    <div className="mt-2 text-[9px] text-muted">
                      SECTOR: <span className="text-foreground">{summary.sector}</span>
                    </div>
                  )}
                  {summary.topic && (
                    <div className="mt-1 text-[9px] text-muted">
                      TOPIC: <span className="text-accent">{summary.topic}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className={`grid grid-cols-1 ${GRID_COLS[Math.min(tickers.length, 4)]} gap-px bg-card-border`}>
            {tickers.map((t) => (
              <div key={t} className="bg-card-bg p-4">
                <div className="text-[10px] text-muted tracking-widest mb-2">{t} SENTIMENT TREND</div>
                <SentimentTrend ticker={t} range="30d" />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
