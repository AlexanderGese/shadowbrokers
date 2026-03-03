import Link from "next/link";
import type { TickerSummary } from "@/lib/types";

export function TickerCard({ ticker }: { ticker: TickerSummary }) {
  const sentimentColor =
    ticker.overall_sentiment === "bullish"
      ? "text-bullish border-bullish/30"
      : ticker.overall_sentiment === "bearish"
        ? "text-bearish border-bearish/30"
        : "text-neutral border-neutral/30";

  const sentimentBg =
    ticker.overall_sentiment === "bullish"
      ? "bg-bullish/10"
      : ticker.overall_sentiment === "bearish"
        ? "bg-bearish/10"
        : "bg-neutral/10";

  const directionArrow =
    ticker.overall_sentiment === "bullish"
      ? "\u25B2"
      : ticker.overall_sentiment === "bearish"
        ? "\u25BC"
        : "\u25C6";

  return (
    <Link href={`/ticker/${ticker.ticker}`}>
      <div className={`border ${sentimentColor} bg-card-bg p-4 hover:bg-card-border/50 transition-colors cursor-pointer group`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-bold tracking-wider text-foreground group-hover:text-accent transition-colors">
              {ticker.ticker}
            </div>
            <div className="text-[10px] text-muted uppercase tracking-wide">
              {ticker.asset_type}
            </div>
          </div>
          <span className={`text-lg ${sentimentColor}`}>
            {directionArrow}
          </span>
        </div>

        <div className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${sentimentBg} ${sentimentColor} mb-3`}>
          {ticker.overall_sentiment}
        </div>

        {/* Confidence bar */}
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-muted mb-1">
            <span>CONFIDENCE</span>
            <span>{Math.round(ticker.avg_confidence * 100)}%</span>
          </div>
          <div className="h-1 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full ${
                ticker.overall_sentiment === "bullish"
                  ? "bg-bullish"
                  : ticker.overall_sentiment === "bearish"
                    ? "bg-bearish"
                    : "bg-neutral"
              } transition-all`}
              style={{ width: `${ticker.avg_confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Sentiment breakdown */}
        <div className="flex gap-3 text-[10px]">
          <span className="text-bullish">{ticker.bullish_count}B</span>
          <span className="text-neutral">{ticker.neutral_count}N</span>
          <span className="text-bearish">{ticker.bearish_count}R</span>
          <span className="text-muted ml-auto">{ticker.num_articles} articles</span>
        </div>
      </div>
    </Link>
  );
}
