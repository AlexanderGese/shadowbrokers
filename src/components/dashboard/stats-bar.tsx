import type { TickerSummary } from "@/lib/types";

interface StatsBarProps {
  tickers: TickerSummary[];
  totalArticles: number;
}

export function StatsBar({ tickers, totalArticles }: StatsBarProps) {
  const bullish = tickers.filter((t) => t.overall_sentiment === "bullish");
  const bearish = tickers.filter((t) => t.overall_sentiment === "bearish");

  const topBullish = bullish.sort((a, b) => b.avg_confidence - a.avg_confidence)[0];
  const topBearish = bearish.sort((a, b) => b.avg_confidence - a.avg_confidence)[0];

  const stats = [
    {
      label: "TICKERS TRACKED",
      value: tickers.length.toString(),
      color: "text-accent",
    },
    {
      label: "ARTICLES ANALYZED",
      value: totalArticles.toString(),
      color: "text-foreground",
    },
    {
      label: "TOP BULLISH",
      value: topBullish?.ticker || "---",
      color: "text-bullish",
    },
    {
      label: "TOP BEARISH",
      value: topBearish?.ticker || "---",
      color: "text-bearish",
    },
    {
      label: "BULLISH SIGNALS",
      value: bullish.length.toString(),
      color: "text-bullish",
    },
    {
      label: "BEARISH SIGNALS",
      value: bearish.length.toString(),
      color: "text-bearish",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-b border-card-border">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-r border-card-border px-4 py-3 last:border-r-0"
        >
          <div className="text-[10px] text-muted tracking-wider">{stat.label}</div>
          <div className={`text-lg font-bold ${stat.color} tracking-wide`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
