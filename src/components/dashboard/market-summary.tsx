import Link from "next/link";
import type { TickerSummary } from "@/lib/types";

interface MarketSummaryProps {
  tickers: TickerSummary[];
  totalArticles: number;
}

export function MarketSummary({ tickers, totalArticles }: MarketSummaryProps) {
  const bullish = tickers.filter((t) => t.overall_sentiment === "bullish");
  const bearish = tickers.filter((t) => t.overall_sentiment === "bearish");
  const neutral = tickers.filter((t) => t.overall_sentiment === "neutral");

  const totalSignals = tickers.reduce((acc, t) => acc + t.num_articles, 0);

  // Sector breakdown
  const sectorCounts = new Map<string, number>();
  for (const t of tickers) {
    const s = t.sector || "Unknown";
    sectorCounts.set(s, (sectorCounts.get(s) || 0) + 1);
  }
  const topSectors = Array.from(sectorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Trending topics
  const topicCounts = new Map<string, number>();
  for (const t of tickers) {
    if (t.topic) {
      topicCounts.set(t.topic, (topicCounts.get(t.topic) || 0) + 1);
    }
  }
  const trendingTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Overall market sentiment
  const marketSentiment = bullish.length > bearish.length ? "BULLISH" : bearish.length > bullish.length ? "BEARISH" : "MIXED";
  const marketColor = marketSentiment === "BULLISH" ? "text-bullish" : marketSentiment === "BEARISH" ? "text-bearish" : "text-neutral";

  return (
    <div className="border-b border-card-border">
      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 border-b border-card-border">
        <StatCell label="MARKET BIAS" value={marketSentiment} color={marketColor} />
        <StatCell label="TICKERS" value={tickers.length.toString()} color="text-accent" />
        <StatCell label="ARTICLES" value={totalArticles.toString()} color="text-foreground" />
        <StatCell label="SIGNALS" value={totalSignals.toString()} color="text-foreground" />
        <StatCell label="BULLISH" value={bullish.length.toString()} color="text-bullish" />
        <StatCell label="BEARISH" value={bearish.length.toString()} color="text-bearish" />
        <StatCell label="NEUTRAL" value={neutral.length.toString()} color="text-neutral" />
        <StatCell label="SECTORS" value={sectorCounts.size.toString()} color="text-accent" />
      </div>

      {/* Sentiment bar */}
      <div className="px-4 py-2 border-b border-card-border">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted tracking-widest shrink-0">MARKET SENTIMENT</span>
          <div className="flex-1 h-2 flex rounded-sm overflow-hidden bg-background">
            {bullish.length > 0 && (
              <div className="bg-bullish" style={{ width: `${(bullish.length / tickers.length) * 100}%` }} />
            )}
            {neutral.length > 0 && (
              <div className="bg-neutral" style={{ width: `${(neutral.length / tickers.length) * 100}%` }} />
            )}
            {bearish.length > 0 && (
              <div className="bg-bearish" style={{ width: `${(bearish.length / tickers.length) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-3 text-[10px] shrink-0">
            <span className="text-bullish">{Math.round((bullish.length / (tickers.length || 1)) * 100)}% B</span>
            <span className="text-neutral">{Math.round((neutral.length / (tickers.length || 1)) * 100)}% N</span>
            <span className="text-bearish">{Math.round((bearish.length / (tickers.length || 1)) * 100)}% R</span>
          </div>
        </div>
      </div>

      {/* Trending topics + top sectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-card-border">
        {/* Trending Topics */}
        <div className="px-4 py-2">
          <div className="text-[10px] text-muted tracking-widest mb-2">TRENDING TOPICS</div>
          <div className="flex flex-wrap gap-1.5">
            {trendingTopics.map(([topic, count]) => (
              <Link key={topic} href={`/topic/${encodeURIComponent(topic)}`} className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors">
                {topic} <span className="text-muted">({count})</span>
              </Link>
            ))}
            {trendingTopics.length === 0 && (
              <span className="text-[10px] text-muted">No topics yet</span>
            )}
          </div>
        </div>

        {/* Top Sectors */}
        <div className="px-4 py-2">
          <div className="text-[10px] text-muted tracking-widest mb-2">ACTIVE SECTORS</div>
          <div className="flex flex-wrap gap-1.5">
            {topSectors.map(([sector, count]) => (
              <span key={sector} className="text-[10px] px-2 py-0.5 bg-card-bg text-foreground border border-card-border">
                {sector} <span className="text-muted">({count})</span>
              </span>
            ))}
            {topSectors.length === 0 && (
              <span className="text-[10px] text-muted">No sector data yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-r border-card-border px-3 py-2.5 last:border-r-0">
      <div className="text-[9px] text-muted tracking-wider">{label}</div>
      <div className={`text-base font-bold ${color} tracking-wide`}>{value}</div>
    </div>
  );
}
