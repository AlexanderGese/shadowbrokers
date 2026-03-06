"use client";

import { useEffect, useState } from "react";

interface EarningsEntry {
  ticker: string;
  name: string | null;
  sector: string | null;
  nextDate: string;
  epsEstimate: number | null;
  lastEpsActual: number | null;
  lastSurprisePct: number | null;
  sentiment: string;
  confidence: number;
}

export function EarningsCalendar() {
  const [earnings, setEarnings] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/earnings")
      .then((r) => r.json())
      .then((d) => setEarnings(d.earnings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border-b border-card-border">
        <div className="px-4 py-2 border-b border-card-border">
          <span className="text-[10px] text-muted tracking-widest">EARNINGS CALENDAR</span>
        </div>
        <div className="h-48 flex items-center justify-center">
          <span className="text-[10px] text-muted tracking-widest animate-pulse">LOADING EARNINGS DATA...</span>
        </div>
      </div>
    );
  }

  const now = new Date();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const thisWeek = earnings.filter((e) => {
    const d = new Date(e.nextDate);
    return d >= now && d <= weekFromNow;
  });

  const upcoming = earnings.filter((e) => {
    const d = new Date(e.nextDate);
    return d > weekFromNow;
  });

  const past = earnings.filter((e) => {
    const d = new Date(e.nextDate);
    return d < now;
  });

  function getCountdown(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - now.getTime();
    if (diff < 0) return "REPORTED";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "TODAY";
    if (days === 1) return "TOMORROW";
    return `${days} DAYS`;
  }

  function renderSection(title: string, items: EarningsEntry[], highlight: boolean) {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-4 py-1.5 border-b border-card-border bg-card-bg">
          <span className={`text-[9px] tracking-widest font-bold ${highlight ? "text-accent" : "text-muted"}`}>
            {title} ({items.length})
          </span>
        </div>
        <div className="divide-y divide-card-border">
          {items.map((e) => {
            const sentColor = e.sentiment === "bullish" ? "text-bullish" : e.sentiment === "bearish" ? "text-bearish" : "text-neutral";
            const sentBg = e.sentiment === "bullish" ? "bg-bullish/10" : e.sentiment === "bearish" ? "bg-bearish/10" : "bg-neutral/10";
            const countdown = getCountdown(e.nextDate);
            const isClose = countdown !== "REPORTED" && parseInt(countdown) <= 7;

            return (
              <div key={e.ticker} className="px-4 py-3 flex items-center gap-3 hover:bg-card-border/10 transition-colors flex-wrap">
                {/* Ticker & Name */}
                <div className="w-24 shrink-0">
                  <a href={`/ticker/${e.ticker}`} className="text-xs font-bold text-foreground hover:text-accent transition-colors">
                    {e.ticker}
                  </a>
                  <div className="text-[9px] text-muted truncate">{e.name || "---"}</div>
                </div>

                {/* Date & Countdown */}
                <div className="w-28 shrink-0">
                  <div className="text-[10px] text-foreground">{e.nextDate}</div>
                  <div className={`text-[9px] font-bold ${isClose ? "text-accent" : "text-muted"}`}>
                    {countdown}
                  </div>
                </div>

                {/* EPS Estimate */}
                <div className="w-20 shrink-0 text-center">
                  <div className="text-[9px] text-muted">EST EPS</div>
                  <div className="text-[10px] text-foreground">
                    {e.epsEstimate !== null ? `$${e.epsEstimate.toFixed(2)}` : "---"}
                  </div>
                </div>

                {/* Last Surprise */}
                <div className="w-24 shrink-0 text-center">
                  <div className="text-[9px] text-muted">LAST SURPRISE</div>
                  {e.lastSurprisePct !== null ? (
                    <div className={`text-[10px] font-bold ${e.lastSurprisePct >= 0 ? "text-bullish" : "text-bearish"}`}>
                      {e.lastSurprisePct >= 0 ? "+" : ""}{e.lastSurprisePct.toFixed(1)}%
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted">---</div>
                  )}
                </div>

                {/* Sentiment Badge */}
                <div className="shrink-0">
                  <span className={`text-[9px] px-2 py-0.5 font-bold uppercase ${sentBg} ${sentColor}`}>
                    {e.sentiment}
                  </span>
                </div>

                {/* Sector */}
                <div className="hidden md:block text-[9px] text-muted ml-auto">
                  {e.sector || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-card-border">
      <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
        <span className="text-[10px] text-muted tracking-widest">EARNINGS CALENDAR</span>
        <span className="text-[9px] text-muted">{earnings.length} TICKERS TRACKED</span>
      </div>

      {earnings.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <span className="text-[10px] text-muted">No upcoming earnings data available</span>
        </div>
      ) : (
        <div className="py-2">
          {renderSection("THIS WEEK", thisWeek, true)}
          {renderSection("UPCOMING", upcoming, false)}
          {renderSection("RECENTLY REPORTED", past.slice(0, 10), false)}
        </div>
      )}
    </div>
  );
}
