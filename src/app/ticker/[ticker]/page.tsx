import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const revalidate = 300;

interface TickerPageProps {
  params: Promise<{ ticker: string }>;
}

export default async function TickerPage({ params }: TickerPageProps) {
  const { ticker } = await params;
  const supabase = createServerClient();

  const [summaryResult, analysesResult] = await Promise.all([
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            &larr; BACK TO DASHBOARD
          </Link>
          <span className="text-card-border">|</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-bullish pulse-dot" />
            <span className="text-xs text-muted tracking-widest">SHADOWBROKERS</span>
          </div>
        </div>
      </header>

      {/* Ticker header */}
      <div className="border-b border-card-border bg-card-bg px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-foreground">
              {summary.ticker}
            </h1>
            <div className="text-xs text-muted uppercase tracking-wide mt-1">
              {summary.name || summary.asset_type}
            </div>
          </div>

          <div className={`border ${sentimentBg} px-4 py-2 text-center`}>
            <div className={`text-lg font-bold ${sentimentColor}`}>
              {summary.overall_sentiment === "bullish" ? "\u25B2" : summary.overall_sentiment === "bearish" ? "\u25BC" : "\u25C6"}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-widest ${sentimentColor}`}>
              {summary.overall_sentiment}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <StatBox label="CONFIDENCE" value={`${Math.round(summary.avg_confidence * 100)}%`} color="text-accent" />
          <StatBox label="ARTICLES" value={summary.num_articles.toString()} color="text-foreground" />
          <StatBox label="BULLISH" value={summary.bullish_count.toString()} color="text-bullish" />
          <StatBox label="NEUTRAL" value={summary.neutral_count.toString()} color="text-neutral" />
          <StatBox label="BEARISH" value={summary.bearish_count.toString()} color="text-bearish" />
        </div>

        {/* Sentiment bar */}
        <div className="mt-4">
          <div className="h-2 flex rounded-full overflow-hidden bg-background">
            {summary.bullish_count > 0 && (
              <div
                className="bg-bullish"
                style={{ width: `${(summary.bullish_count / summary.num_articles) * 100}%` }}
              />
            )}
            {summary.neutral_count > 0 && (
              <div
                className="bg-neutral"
                style={{ width: `${(summary.neutral_count / summary.num_articles) * 100}%` }}
              />
            )}
            {summary.bearish_count > 0 && (
              <div
                className="bg-bearish"
                style={{ width: `${(summary.bearish_count / summary.num_articles) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Analyses list */}
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
                    <div className="flex items-center gap-2 mt-1">
                      {article && (
                        <span className="text-[10px] text-muted uppercase">
                          {article.source}
                        </span>
                      )}
                      {article?.published_at && (
                        <span className="text-[10px] text-muted">
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
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
    <div className="border border-card-border bg-card-bg px-3 py-2">
      <div className="text-[10px] text-muted tracking-wider">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
