import { createServerClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { WatchlistSection } from "@/components/dashboard/watchlist-section";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ChatWidget } from "@/components/chat/chat-widget";

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

      <ChatWidget />

      {/* Footer */}
      <footer className="border-t border-card-border px-4 py-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[10px] text-muted tracking-wider">
            SHADOWBROKERS v6.0 | AI-POWERED MARKET INTELLIGENCE
          </span>
          <div className="flex items-center gap-3">
            <a href="/news" className="text-[10px] text-muted hover:text-accent transition-colors">NEWS</a>
            <a href="/compare" className="text-[10px] text-muted hover:text-accent transition-colors">COMPARE</a>
            <a href="/portfolio" className="text-[10px] text-muted hover:text-accent transition-colors">PORTFOLIO</a>
            <a href="/settings" className="text-[10px] text-muted hover:text-accent transition-colors">SETTINGS</a>
            <span className="text-[10px] text-muted">
              HOURLY ANALYSIS | GPT-4O
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-card-border/50 mt-2 pt-2">
          <a href="/pricing" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRICING</a>
          <span className="text-[10px] text-muted/30">|</span>
          <a href="/terms" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">TERMS</a>
          <span className="text-[10px] text-muted/30">|</span>
          <a href="/privacy" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">PRIVACY</a>
          <span className="text-[10px] text-muted/30">|</span>
          <a href="/disclaimer" className="text-[10px] text-muted hover:text-accent transition-colors tracking-wider">DISCLAIMER</a>
        </div>
      </footer>
    </div>
  );
}
