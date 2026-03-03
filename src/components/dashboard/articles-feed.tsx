import type { Article, Analysis } from "@/lib/types";

interface ArticleWithAnalyses extends Article {
  analyses: Pick<Analysis, "ticker" | "sentiment" | "confidence">[];
}

interface ArticlesFeedProps {
  articles: ArticleWithAnalyses[];
}

export function ArticlesFeed({ articles }: ArticlesFeedProps) {
  if (articles.length === 0) {
    return (
      <div className="border border-card-border bg-card-bg p-6 text-center">
        <div className="text-muted text-xs">
          <span className="text-accent">&gt;</span> No articles yet. Run analysis to fetch news.
        </div>
      </div>
    );
  }

  // Source stats
  const sourceCounts = new Map<string, number>();
  for (const a of articles) {
    sourceCounts.set(a.source, (sourceCounts.get(a.source) || 0) + 1);
  }

  return (
    <div className="border border-card-border bg-card-bg">
      <div className="px-4 py-2 border-b border-card-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted tracking-widest">NEWS FEED</span>
          <span className="text-[10px] text-muted">{articles.length} articles</span>
        </div>
        <div className="flex gap-2">
          {Array.from(sourceCounts.entries()).map(([source, count]) => (
            <span key={source} className={`text-[8px] px-1.5 py-px uppercase tracking-wider ${sourceColors[source] || "text-muted"} bg-card-border/30`}>
              {source} ({count})
            </span>
          ))}
        </div>
      </div>
      <div className="divide-y divide-card-border max-h-[700px] overflow-y-auto">
        {articles.map((article) => (
          <ArticleRow key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

const sourceColors: Record<string, string> = {
  reuters: "text-accent",
  cnbc: "text-neutral",
  yahoo: "text-bullish",
  marketwatch: "text-bearish",
  ft: "text-[#FCD0B1]",
  ap: "text-foreground",
};

function ArticleRow({ article }: { article: ArticleWithAnalyses }) {
  const topSentiment = article.analyses?.[0]?.sentiment;
  const dotColor =
    topSentiment === "bullish"
      ? "bg-bullish"
      : topSentiment === "bearish"
        ? "bg-bearish"
        : topSentiment === "neutral"
          ? "bg-neutral"
          : "bg-muted";

  const timeAgo = article.published_at
    ? getTimeAgo(new Date(article.published_at))
    : "";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-4 py-3 hover:bg-card-border/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`h-2 w-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-foreground leading-relaxed line-clamp-2">
            {article.title}
          </div>
          {article.description && (
            <div className="text-[10px] text-muted leading-relaxed line-clamp-1 mt-0.5">
              {article.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] uppercase tracking-wider ${sourceColors[article.source] || "text-muted"}`}>
              {article.source}
            </span>
            <span className="text-[10px] text-muted">{timeAgo}</span>
            {article.analyses?.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {article.analyses.map((a, i) => (
                  <span
                    key={i}
                    className={`text-[9px] px-1 ${
                      a.sentiment === "bullish"
                        ? "text-bullish bg-bullish/10"
                        : a.sentiment === "bearish"
                          ? "text-bearish bg-bearish/10"
                          : "text-neutral bg-neutral/10"
                    }`}
                  >
                    {a.ticker}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
