"use client";

import { useState } from "react";
import { SentimentTrend } from "./sentiment-trend";
import { SectorHeatmapChart } from "./sector-heatmap-chart";
import { PriceSentimentOverlay } from "./price-sentiment-overlay";
import { ConfidenceHistogram } from "./confidence-histogram";

type ChartTab = "SENTIMENT" | "HEATMAP" | "PRICE OVERLAY" | "CONFIDENCE";

const CHART_TABS: { key: ChartTab; label: string }[] = [
  { key: "SENTIMENT", label: "SENTIMENT" },
  { key: "HEATMAP", label: "HEATMAP" },
  { key: "PRICE OVERLAY", label: "PRICE OVERLAY" },
  { key: "CONFIDENCE", label: "CONFIDENCE" },
];

interface MarketSentimentChartProps {
  tickers?: string[];
}

export function MarketSentimentChart({ tickers = [] }: MarketSentimentChartProps) {
  const [activeChart, setActiveChart] = useState<ChartTab>("SENTIMENT");

  return (
    <div className="border-b border-card-border">
      {/* Sub-tab bar */}
      <div className="px-4 py-2 border-b border-card-border flex items-center gap-1 overflow-x-auto">
        {CHART_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveChart(tab.key)}
            className={`text-[9px] px-3 py-1.5 tracking-widest border transition-colors whitespace-nowrap ${
              activeChart === tab.key
                ? "bg-accent/15 text-accent border-accent/30"
                : "border-card-border text-muted hover:text-foreground hover:border-card-border/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart content */}
      {activeChart === "SENTIMENT" && (
        <div className="p-4">
          <SentimentTrend range="30d" />
        </div>
      )}

      {activeChart === "HEATMAP" && (
        <SectorHeatmapChart />
      )}

      {activeChart === "PRICE OVERLAY" && (
        <PriceSentimentOverlay tickers={tickers.length > 0 ? tickers : ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"]} />
      )}

      {activeChart === "CONFIDENCE" && (
        <ConfidenceHistogram />
      )}
    </div>
  );
}
