import { createServerClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatsBar } from "@/components/dashboard/stats-bar";
import { TickerGrid } from "@/components/dashboard/ticker-grid";
import { ArticlesFeed } from "@/components/dashboard/articles-feed";

export const revalidate = 300;

export default async function Dashboard() {
  const supabase = createServerClient();

  const [tickersResult, articlesResult] = await Promise.all([
    supabase
      .from("ticker_summaries")
      .select("*")
      .order("num_articles", { ascending: false })
      .limit(30),
    supabase
      .from("articles")
      .select("*, analyses(ticker, sentiment, confidence)")
      .order("published_at", { ascending: false })
      .limit(30),
  ]);

  const tickers = tickersResult.data || [];
  const articles = articlesResult.data || [];

  const lastUpdated = tickers.length > 0 ? tickers[0].last_updated : null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader lastUpdated={lastUpdated} />
      <StatsBar tickers={tickers} totalArticles={articles.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-card-border mt-px">
        <div className="lg:col-span-2 bg-background">
          <TickerGrid tickers={tickers} />
        </div>

        <div className="bg-background">
          <ArticlesFeed articles={articles as never} />
        </div>
      </div>

      <footer className="border-t border-card-border px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted tracking-wider">
          SHADOWBROKERS v1.0 | AI-POWERED MARKET INTELLIGENCE
        </span>
        <span className="text-[10px] text-muted">
          DATA REFRESHES EVERY 4 HOURS | POWERED BY GPT-4O-MINI
        </span>
      </footer>
    </div>
  );
}
