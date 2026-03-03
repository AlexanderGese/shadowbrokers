import { createServerClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { WatchlistSection } from "@/components/dashboard/watchlist-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
      <WatchlistSection />
      <DashboardShell
        tickers={tickers}
        articles={articles as never}
        totalArticleCount={totalArticleCount}
      />

      {/* Footer */}
      <footer className="border-t border-card-border px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[10px] text-muted tracking-wider">
          SHADOWBROKERS v4.0 | AI-POWERED MARKET INTELLIGENCE
        </span>
        <div className="flex items-center gap-3">
          <a href="/compare" className="text-[10px] text-muted hover:text-accent transition-colors">COMPARE</a>
          <a href="/portfolio" className="text-[10px] text-muted hover:text-accent transition-colors">PORTFOLIO</a>
          <a href="/alerts" className="text-[10px] text-muted hover:text-accent transition-colors">ALERTS</a>
          <span className="text-[10px] text-muted">
            DAILY @ 08:00 UTC | GPT-4O-MINI
          </span>
        </div>
      </footer>
    </div>
  );
}
