import { createServerClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { MarketSummary } from "@/components/dashboard/market-summary";
import { TopMovers } from "@/components/dashboard/top-movers";
import { SectorHeatmap } from "@/components/dashboard/sector-heatmap";
import { TickerTable } from "@/components/dashboard/ticker-table";
import { TickerGrid } from "@/components/dashboard/ticker-grid";
import { ArticlesFeed } from "@/components/dashboard/articles-feed";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createServerClient();

  const [tickersResult, articlesResult, totalArticlesResult] = await Promise.all([
    supabase
      .from("ticker_summaries")
      .select("*")
      .order("num_articles", { ascending: false })
      .limit(100),
    supabase
      .from("articles")
      .select("*, analyses(ticker, sentiment, confidence)")
      .order("published_at", { ascending: false })
      .limit(50),
    supabase
      .from("articles")
      .select("id", { count: "exact", head: true }),
  ]);

  const tickers = tickersResult.data || [];
  const articles = articlesResult.data || [];
  const totalArticleCount = totalArticlesResult.count || articles.length;

  const lastUpdated = tickers.length > 0 ? tickers[0].last_updated : null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader lastUpdated={lastUpdated} />

      {/* Market Overview */}
      <MarketSummary tickers={tickers} totalArticles={totalArticleCount} />

      {/* Top Movers: Bullish vs Bearish */}
      <TopMovers tickers={tickers} />

      {/* Sector Heatmap */}
      <SectorHeatmap tickers={tickers} />

      {/* Ticker Cards Grid */}
      <TickerGrid tickers={tickers} />

      {/* Full Ticker Table */}
      <TickerTable tickers={tickers} />

      {/* Articles Feed - full width */}
      <div className="border-b border-card-border">
        <ArticlesFeed articles={articles as never} />
      </div>

      {/* Footer */}
      <footer className="border-t border-card-border px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted tracking-wider">
          SHADOWBROKERS v2.0 | AI-POWERED MARKET INTELLIGENCE
        </span>
        <span className="text-[10px] text-muted">
          DATA REFRESHES DAILY @ 08:00 UTC | POWERED BY GPT-4O-MINI
        </span>
      </footer>
    </div>
  );
}
