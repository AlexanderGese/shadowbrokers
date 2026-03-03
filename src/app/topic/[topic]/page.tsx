import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);
  const supabase = createServerClient();

  // Get all analyses with this topic
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*, articles(id, title, url, source, published_at)")
    .eq("topic", decodedTopic)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!analyses?.length) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-card-border bg-card-bg px-6 py-4">
          <Link href="/" className="text-xs text-muted hover:text-accent transition-colors">
            &larr; BACK TO DASHBOARD
          </Link>
        </header>
        <div className="p-8 text-center">
          <div className="text-muted text-xs">
            <span className="text-accent">&gt;</span> No data found for topic: {decodedTopic}
          </div>
        </div>
      </div>
    );
  }

  // Aggregate stats
  const bullish = analyses.filter((a) => a.sentiment === "bullish").length;
  const bearish = analyses.filter((a) => a.sentiment === "bearish").length;
  const neutral = analyses.filter((a) => a.sentiment === "neutral").length;
  const total = analyses.length;
  const avgConf = analyses.reduce((s, a) => s + a.confidence, 0) / total;
  const dominant = bullish >= bearish && bullish >= neutral ? "bullish" : bearish > bullish ? "bearish" : "neutral";

  // Unique tickers
  const tickerMap = new Map<string, { count: number; sentiment: string; confidence: number }>();
  for (const a of analyses) {
    if (!tickerMap.has(a.ticker)) {
      tickerMap.set(a.ticker, { count: 0, sentiment: a.sentiment, confidence: a.confidence });
    }
    tickerMap.get(a.ticker)!.count++;
  }
  const tickers = Array.from(tickerMap.entries()).sort((a, b) => b[1].count - a[1].count);

  // Unique articles
  const articleMap = new Map<string, { title: string; url: string; source: string; published_at: string }>();
  for (const a of analyses) {
    const article = a.articles as unknown as { id: string; title: string; url: string; source: string; published_at: string };
    if (article && !articleMap.has(article.id)) {
      articleMap.set(article.id, article);
    }
  }
  const articles = Array.from(articleMap.values());

  const sentColor = dominant === "bullish" ? "text-bullish" : dominant === "bearish" ? "text-bearish" : "text-neutral";
  const sentBg = dominant === "bullish" ? "bg-bullish/10 border-bullish/30" : dominant === "bearish" ? "bg-bearish/10 border-bearish/30" : "bg-neutral/10 border-neutral/30";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-muted hover:text-accent transition-colors">
            &larr; BACK TO DASHBOARD
          </Link>
          <span className="text-card-border">|</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-bullish pulse-dot" />
            <span className="text-xs text-muted tracking-widest">SHADOWBROKERS</span>
          </div>
        </div>
      </header>

      {/* Topic Header */}
      <div className="border-b border-card-border bg-card-bg px-6 py-6">
        <div className="text-[9px] text-muted uppercase tracking-widest mb-1">TOPIC ANALYSIS</div>
        <h1 className={`text-xl font-bold ${sentColor} mb-3`}>{decodedTopic}</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">SENTIMENT</div>
            <div className={`text-lg font-bold ${sentColor} uppercase`}>{dominant}</div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">CONFIDENCE</div>
            <div className="text-lg font-bold text-accent">{Math.round(avgConf * 100)}%</div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">SIGNALS</div>
            <div className="text-lg font-bold text-foreground">{total}</div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">TICKERS</div>
            <div className="text-lg font-bold text-foreground">{tickers.length}</div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">ARTICLES</div>
            <div className="text-lg font-bold text-foreground">{articles.length}</div>
          </div>
        </div>

        {/* Sentiment bar */}
        <div className="mt-4">
          <div className="h-2 flex rounded-sm overflow-hidden bg-background">
            {bullish > 0 && <div className="bg-bullish" style={{ width: `${(bullish / total) * 100}%` }} />}
            {neutral > 0 && <div className="bg-neutral" style={{ width: `${(neutral / total) * 100}%` }} />}
            {bearish > 0 && <div className="bg-bearish" style={{ width: `${(bearish / total) * 100}%` }} />}
          </div>
          <div className="flex justify-between text-[9px] mt-1">
            <span className="text-bullish">{Math.round((bullish / total) * 100)}% Bullish</span>
            <span className="text-bearish">{Math.round((bearish / total) * 100)}% Bearish</span>
          </div>
        </div>
      </div>

      {/* Affected Tickers */}
      <div className="border-b border-card-border px-6 py-4">
        <div className="text-[10px] text-muted tracking-widest mb-3">AFFECTED TICKERS</div>
        <div className="flex flex-wrap gap-2">
          {tickers.map(([ticker, data]) => {
            const tColor = data.sentiment === "bullish" ? "text-bullish border-bullish/30" : data.sentiment === "bearish" ? "text-bearish border-bearish/30" : "text-neutral border-neutral/30";
            return (
              <Link
                key={ticker}
                href={`/ticker/${ticker}`}
                className={`border ${tColor} px-3 py-1.5 hover:bg-card-border/30 transition-colors`}
              >
                <span className="text-xs font-bold text-foreground">{ticker}</span>
                <span className={`text-[9px] ml-2 ${sentColor}`}>
                  {data.count} signal{data.count !== 1 ? "s" : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Related Articles */}
      <div className="px-6 py-4">
        <div className="text-[10px] text-muted tracking-widest mb-3">
          RELATED ARTICLES ({articles.length})
        </div>
        <div className="space-y-px">
          {articles.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block border border-card-border border-l-2 border-l-accent bg-card-bg p-3 hover:bg-card-border/30 transition-colors`}
            >
              <div className="text-xs text-foreground line-clamp-1">{article.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-accent uppercase">{article.source}</span>
                {article.published_at && (
                  <span className="text-[10px] text-muted">
                    {new Date(article.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
