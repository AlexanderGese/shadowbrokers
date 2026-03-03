import Link from "next/link";
import type { TickerSummary, PriceData } from "@/lib/types";
import { StarButton } from "@/components/ui/star-button";

interface TickerCardProps {
  ticker: TickerSummary;
  price?: PriceData;
}

export function TickerCard({ ticker, price }: TickerCardProps) {
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
      <div className={`border ${sentimentColor} bg-card-bg p-4 hover:bg-card-border/50 transition-all duration-150 cursor-pointer group h-full`}>
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-wider text-foreground group-hover:text-accent transition-colors">
                {ticker.ticker}
              </span>
              <StarButton ticker={ticker.ticker} size="sm" />
            </div>
            {ticker.name && (
              <div className="text-[10px] text-muted truncate mt-0.5" title={ticker.name}>
                {ticker.name}
              </div>
            )}
            {!ticker.name && (
              <div className="text-[10px] text-muted uppercase tracking-wide mt-0.5">
                {ticker.asset_type}
              </div>
            )}
          </div>
          <span className={`text-lg ${sentimentColor} shrink-0 ml-2`}>
            {directionArrow}
          </span>
        </div>

        {/* Live Price */}
        {price && (
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-sm font-bold text-foreground">
              ${price.currentPrice.toFixed(2)}
            </span>
            <span className={`text-[10px] ${price.changePercent >= 0 ? "text-bullish" : "text-bearish"}`}>
              {price.changePercent >= 0 ? "+" : ""}{price.changePercent.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Description */}
        {ticker.description && (
          <div className="text-[9px] text-muted leading-relaxed line-clamp-2 mb-2">
            {ticker.description}
          </div>
        )}

        {/* Tags row: sector + topic */}
        <div className="flex flex-wrap gap-1 mb-2">
          {ticker.sector && (
            <span className="text-[8px] px-1.5 py-px bg-card-border/50 text-muted uppercase tracking-wider">
              {ticker.sector}
            </span>
          )}
          {ticker.topic && (
            <span className={`text-[8px] px-1.5 py-px ${sentimentBg} ${sentimentColor}`}>
              {ticker.topic}
            </span>
          )}
        </div>

        <div className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${sentimentBg} ${sentimentColor} mb-2`}>
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
          <span className="text-muted ml-auto">{ticker.num_articles} arts</span>
        </div>
      </div>
    </Link>
  );
}
