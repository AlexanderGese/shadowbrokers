import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getPrice } from "@/lib/yahoo-finance";
import { notFound } from "next/navigation";
import { SentimentTrend } from "@/components/charts/sentiment-trend";
import { StarButton } from "@/components/ui/star-button";
import { AlertManager } from "@/components/alerts/alert-manager";

export const dynamic = "force-dynamic";

interface TickerPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function TickerPage({ params }: TickerPageProps) {
  const { ticker } = await params;
  const supabase = createServerClient();

  const [summaryResult, analysesResult, priceData] = await Promise.all([
    supabase
      .from("ticker_summaries")
      .select("*")
      .eq("ticker", ticker.toUpperCase())
      .single(),
    supabase
      .from("analyses")
      .select("*, articles(id, title, url, source, published_at)")
      .eq("ticker", ticker.toUpperCase())
      .order("created_at", { ascending: false })
      .limit(50),
    getPrice(ticker.toUpperCase()),
  ]);

  const summary = summaryResult.data;
  const analyses = analysesResult.data || [];

  if (!summary) {
    notFound();
  }

  const sentimentColor =
    summary.overall_sentiment === "bullish"
      ? "text-bullish"
      : summary.overall_sentiment === "bearish"
        ? "text-bearish"
        : "text-neutral";

  const sentimentBg =
    summary.overall_sentiment === "bullish"
      ? "bg-bullish/10 border-bullish/30"
      : summary.overall_sentiment === "bearish"
        ? "bg-bearish/10 border-bearish/30"
        : "bg-neutral/10 border-neutral/30";

  // Collect unique topics from analyses
  const topics = new Map<string, number>();
  for (const a of analyses) {
    if (a.topic) {
      topics.set(a.topic, (topics.get(a.topic) || 0) + 1);
    }
  }
  const sortedTopics = Array.from(topics.entries()).sort((a, b) => b[1] - a[1]);

  const changeColor = priceData && priceData.changePercent >= 0 ? "text-bullish" : "text-bearish";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav Header */}
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
            &larr; BACK TO DASHBOARD
          </Link>
          <span className="text-card-border">|</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-bullish pulse-dot" />
            <span className="text-xs text-muted tracking-widest">SHADOWBROKERS</span>
          </div>
        </div>
      </header>

      {/* Ticker Header */}
      <div className="border-b border-card-border bg-card-bg px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-widest text-foreground">
                {summary.ticker}
              </h1>
              <StarButton ticker={summary.ticker} size="md" />
              <span className="text-[10px] px-2 py-0.5 bg-card-border/50 text-muted uppercase tracking-wider">
                {summary.asset_type}
              </span>
              {summary.sector && (
                <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/20">
                  {summary.sector}
                </span>
              )}
            </div>
            {summary.name && (
              <div className="text-sm text-muted mb-2">{summary.name}</div>
            )}
            {summary.topic && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] text-muted uppercase tracking-widest">DRIVING TOPIC:</span>
                <Link
                  href={`/topic/${encodeURIComponent(summary.topic)}`}
                  className={`text-[10px] px-2 py-0.5 ${sentimentBg} ${sentimentColor} font-bold hover:underline`}
                >
                  {summary.topic}
                </Link>
              </div>
            )}
          </div>

          <div className="shrink-0 ml-4 text-right">
            {/* Price Data */}
            {priceData && (
              <div className="mb-2">
                <div className="text-xl font-bold text-foreground">
                  ${priceData.currentPrice.toFixed(2)}
                </div>
                <div className={`text-xs ${changeColor}`}>
                  {priceData.changePercent >= 0 ? "+" : ""}{priceData.changePercent.toFixed(2)}%
                </div>
              </div>
            )}
            <div className={`border ${sentimentBg} px-4 py-2 text-center`}>
              <div className={`text-lg font-bold ${sentimentColor}`}>
                {summary.overall_sentiment === "bullish" ? "\u25B2" : summary.overall_sentiment === "bearish" ? "\u25BC" : "\u25C6"}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${sentimentColor}`}>
                {summary.overall_sentiment}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Manager */}
        <div className="mt-3">
          <AlertManager ticker={summary.ticker} />
        </div>

        {/* About Section */}
        {summary.description && (
          <div className="mt-4 p-3 border border-card-border bg-background">
            <div className="text-[9px] text-muted uppercase tracking-widest mb-1">ABOUT {summary.ticker}</div>
            <div className="text-xs text-foreground leading-relaxed">
              {summary.description}
            </div>
          </div>
        )}

        {/* Price Details */}
        {priceData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StatBox label="MARKET CAP" value={priceData.marketCap ? formatMarketCap(priceData.marketCap) : "N/A"} color="text-foreground" />
            <StatBox label="DAY RANGE" value={`$${priceData.dayLow.toFixed(2)} - $${priceData.dayHigh.toFixed(2)}`} color="text-foreground" />
            <StatBox label="VOLUME" value={priceData.volume ? formatVolume(priceData.volume) : "N/A"} color="text-foreground" />
            <StatBox label="PREV CLOSE" value={`$${priceData.previousClose.toFixed(2)}`} color="text-foreground" />
          </div>
        )}

        {/* Sentiment Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <StatBox label="CONFIDENCE" value={`${Math.round(summary.avg_confidence * 100)}%`} color="text-accent" />
          <StatBox label="ARTICLES" value={summary.num_articles.toString()} color="text-foreground" />
          <StatBox label="BULLISH" value={summary.bullish_count.toString()} color="text-bullish" />
          <StatBox label="NEUTRAL" value={summary.neutral_count.toString()} color="text-neutral" />
          <StatBox label="BEARISH" value={summary.bearish_count.toString()} color="text-bearish" />
        </div>

        {/* Sentiment Bar */}
        <div className="mt-4">
          <div className="h-2 flex rounded-sm overflow-hidden bg-background">
            {summary.bullish_count > 0 && (
              <div className="bg-bullish" style={{ width: `${(summary.bullish_count / summary.num_articles) * 100}%` }} />
            )}
            {summary.neutral_count > 0 && (
              <div className="bg-neutral" style={{ width: `${(summary.neutral_count / summary.num_articles) * 100}%` }} />
            )}
            {summary.bearish_count > 0 && (
              <div className="bg-bearish" style={{ width: `${(summary.bearish_count / summary.num_articles) * 100}%` }} />
            )}
          </div>
          <div className="flex justify-between text-[9px] mt-1">
            <span className="text-bullish">{Math.round((summary.bullish_count / summary.num_articles) * 100)}% Bullish</span>
            <span className="text-bearish">{Math.round((summary.bearish_count / summary.num_articles) * 100)}% Bearish</span>
          </div>
        </div>
      </div>

      {/* Sentiment Trend Chart */}
      <div className="border-b border-card-border px-6 py-4">
        <div className="text-[10px] text-muted tracking-widest mb-2">SENTIMENT TREND (30D)</div>
        <SentimentTrend ticker={summary.ticker} range="30d" />
      </div>

      {/* Topics Section */}
      {sortedTopics.length > 0 && (
        <div className="border-b border-card-border px-6 py-3">
          <div className="text-[9px] text-muted uppercase tracking-widest mb-2">NEWS TOPICS AFFECTING {summary.ticker}</div>
          <div className="flex flex-wrap gap-1.5">
            {sortedTopics.map(([topic, count]) => (
              <Link
                key={topic}
                href={`/topic/${encodeURIComponent(topic)}`}
                className={`text-[10px] px-2 py-0.5 ${sentimentBg} ${sentimentColor} hover:underline`}
              >
                {topic} <span className="opacity-60">({count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Analyses List */}
      <div className="px-6 py-4">
        <div className="text-[10px] text-muted tracking-widest mb-3">
          ANALYSIS HISTORY ({analyses.length} entries)
        </div>

        <div className="space-y-px">
          {analyses.map((analysis) => {
            const article = analysis.articles as unknown as {
              id: string;
              title: string;
              url: string;
              source: string;
              published_at: string;
            };

            const aSentimentColor =
              analysis.sentiment === "bullish"
                ? "text-bullish border-l-bullish"
                : analysis.sentiment === "bearish"
                  ? "text-bearish border-l-bearish"
                  : "text-neutral border-l-neutral";

            return (
              <div
                key={analysis.id}
                className={`border border-card-border border-l-2 ${aSentimentColor} bg-card-bg p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    {article && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-foreground hover:text-accent transition-colors line-clamp-1"
                      >
                        {article.title}
                      </a>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {article && (
                        <span className="text-[10px] text-muted uppercase">{article.source}</span>
                      )}
                      {article?.published_at && (
                        <span className="text-[10px] text-muted">
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
                      )}
                      {analysis.topic && (
                        <Link
                          href={`/topic/${encodeURIComponent(analysis.topic)}`}
                          className={`text-[9px] px-1.5 py-px hover:underline ${
                            analysis.sentiment === "bullish" ? "bg-bullish/10 text-bullish" :
                            analysis.sentiment === "bearish" ? "bg-bearish/10 text-bearish" :
                            "bg-neutral/10 text-neutral"
                          }`}
                        >
                          {analysis.topic}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <div className="text-right">
                      <div className={`text-[10px] font-bold uppercase ${aSentimentColor}`}>
                        {analysis.sentiment}
                      </div>
                      <div className="text-[10px] text-muted">
                        {Math.round(analysis.confidence * 100)}% conf
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${
                        analysis.predicted_direction === "up"
                          ? "text-bullish"
                          : analysis.predicted_direction === "down"
                            ? "text-bearish"
                            : "text-neutral"
                      }`}>
                        {analysis.predicted_direction === "up" ? "\u25B2" : analysis.predicted_direction === "down" ? "\u25BC" : "\u25C6"}
                        {" "}{analysis.predicted_magnitude.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-muted leading-relaxed mt-2 border-t border-card-border pt-2">
                  {analysis.reasoning}
                </div>
              </div>
            );
          })}
        </div>

        {analyses.length === 0 && (
          <div className="border border-card-border bg-card-bg p-8 text-center">
            <div className="text-muted text-xs">
              <span className="text-accent">&gt;</span> No analysis data for this ticker yet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-card-border bg-background px-3 py-2">
      <div className="text-[10px] text-muted tracking-wider">{label}</div>
      <div className={`text-sm font-bold ${color} truncate`}>{value}</div>
    </div>
  );
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
  return vol.toLocaleString();
}
