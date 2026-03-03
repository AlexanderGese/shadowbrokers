import Link from "next/link";
import type { TickerSummary } from "@/lib/types";

interface TopMoversProps {
  tickers: TickerSummary[];
}

export function TopMovers({ tickers }: TopMoversProps) {
  const bullish = [...tickers]
    .filter((t) => t.overall_sentiment === "bullish")
    .sort((a, b) => b.avg_confidence - a.avg_confidence)
    .slice(0, 5);

  const bearish = [...tickers]
    .filter((t) => t.overall_sentiment === "bearish")
    .sort((a, b) => b.avg_confidence - a.avg_confidence)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-card-border border-b border-card-border">
      {/* Bullish Panel */}
      <div>
        <div className="px-4 py-2 border-b border-card-border flex items-center gap-2">
          <span className="text-bullish text-sm">&#9650;</span>
          <span className="text-[10px] text-bullish tracking-widest font-bold">TOP BULLISH SIGNALS</span>
        </div>
        <div className="divide-y divide-card-border">
          {bullish.map((t, i) => (
            <MoverRow key={t.ticker} ticker={t} rank={i + 1} type="bullish" />
          ))}
          {bullish.length === 0 && (
            <div className="px-4 py-6 text-center text-[10px] text-muted">No bullish signals</div>
          )}
        </div>
      </div>

      {/* Bearish Panel */}
      <div>
        <div className="px-4 py-2 border-b border-card-border flex items-center gap-2">
          <span className="text-bearish text-sm">&#9660;</span>
          <span className="text-[10px] text-bearish tracking-widest font-bold">TOP BEARISH SIGNALS</span>
        </div>
        <div className="divide-y divide-card-border">
          {bearish.map((t, i) => (
            <MoverRow key={t.ticker} ticker={t} rank={i + 1} type="bearish" />
          ))}
          {bearish.length === 0 && (
            <div className="px-4 py-6 text-center text-[10px] text-muted">No bearish signals</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MoverRow({ ticker, rank, type }: { ticker: TickerSummary; rank: number; type: "bullish" | "bearish" }) {
  const color = type === "bullish" ? "text-bullish" : "text-bearish";
  const barColor = type === "bullish" ? "bg-bullish" : "bg-bearish";

  return (
    <Link href={`/ticker/${ticker.ticker}`}>
      <div className="px-4 py-3 hover:bg-card-border/30 transition-colors cursor-pointer group">
        <div className="flex items-start gap-3">
          <span className={`text-xs font-bold ${color} w-4 shrink-0`}>#{rank}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                {ticker.ticker}
              </span>
              {ticker.name && (
                <span className="text-[10px] text-muted truncate">{ticker.name}</span>
              )}
            </div>
            {ticker.description && (
              <div className="text-[10px] text-muted mt-0.5 line-clamp-1">{ticker.description}</div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {ticker.topic && (
                <span className={`text-[9px] px-1.5 py-px ${type === "bullish" ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`}>
                  {ticker.topic}
                </span>
              )}
              {ticker.sector && (
                <span className="text-[9px] px-1.5 py-px bg-card-bg text-muted border border-card-border">
                  {ticker.sector}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-xs font-bold ${color}`}>
              {Math.round(ticker.avg_confidence * 100)}%
            </div>
            <div className="w-16 h-1 bg-background rounded-full overflow-hidden mt-1">
              <div className={`h-full ${barColor}`} style={{ width: `${ticker.avg_confidence * 100}%` }} />
            </div>
            <div className="text-[9px] text-muted mt-0.5">{ticker.num_articles} articles</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
