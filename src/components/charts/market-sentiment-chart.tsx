"use client";

import { SentimentTrend } from "./sentiment-trend";

export function MarketSentimentChart() {
  return (
    <div className="border-b border-card-border">
      <div className="px-4 py-2 border-b border-card-border">
        <span className="text-[10px] text-muted tracking-widest">
          MARKET SENTIMENT TREND (30D)
        </span>
      </div>
      <div className="p-4">
        <SentimentTrend range="30d" />
      </div>
    </div>
  );
}
