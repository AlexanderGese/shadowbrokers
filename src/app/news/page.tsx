"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ArticleAnalysis {
  ticker: string;
  sentiment: string;
  confidence: number;
  predicted_direction: string;
}

interface Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  published_at: string | null;
  analyzed: boolean;
  created_at: string;
  analyses: ArticleAnalysis[];
}

interface SourceInfo {
  name: string;
  count: number;
}

const SOURCE_COLORS: Record<string, string> = {
  reuters: "text-accent",
  cnbc: "text-neutral",
  yahoo: "text-bullish",
  marketwatch: "text-bearish",
  ft: "text-[#FCD0B1]",
  ap: "text-foreground",
  bloomberg: "text-[#FF6600]",
  wsj: "text-[#0080C6]",
  barrons: "text-[#C9A96E]",
  investing: "text-[#FF8C00]",
  seekingalpha: "text-[#F58220]",
  benzinga: "text-[#00BFFF]",
  techcrunch: "text-bullish",
  verge: "text-[#E54D69]",
  arstechnica: "text-[#FF4500]",
  fed: "text-accent",
  ecb: "text-accent",
  economist: "text-bearish",
  fortune: "text-[#E8112D]",
  coindesk: "text-neutral",
  cointelegraph: "text-bullish",
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [analyzedFilter, setAnalyzedFilter] = useState<"" | "true" | "false">("");
  const limit = 50;

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (source) params.set("source", source);
      if (search) params.set("q", search);
      if (analyzedFilter) params.set("analyzed", analyzedFilter);

      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
      setSources(data.sources || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, source, search, sort, analyzedFilter]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
              &larr; DASHBOARD
            </Link>
            <span className="text-card-border">|</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent pulse-dot" />
              <span className="text-xs text-muted tracking-widest">NEWS FEED</span>
            </div>
          </div>
          <span className="text-[10px] text-muted">{total.toLocaleString()} ARTICLES</span>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="border-b border-card-border bg-card-bg/50">
        {/* Search */}
        <div className="px-6 py-3 border-b border-card-border">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <div className="flex-1 flex items-center border border-card-border bg-background">
              <span className="text-[10px] text-accent px-2">$</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search articles..."
                className="w-full bg-transparent text-xs text-foreground py-2 pr-3 focus:outline-none placeholder:text-muted/40"
              />
            </div>
            <button
              type="submit"
              className="text-[10px] px-4 py-2 border border-accent/30 text-accent hover:bg-accent/10 transition-colors tracking-widest"
            >
              SEARCH
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
                className="text-[10px] px-3 py-2 border border-card-border text-muted hover:text-foreground transition-colors tracking-widest"
              >
                CLEAR
              </button>
            )}
          </form>
        </div>

        {/* Source filters + sort */}
        <div className="px-6 py-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setSource(""); setPage(1); }}
            className={`text-[9px] px-2 py-1 tracking-widest border transition-colors ${
              !source ? "text-accent border-accent bg-accent/5" : "text-muted border-card-border hover:text-foreground"
            }`}
          >
            ALL
          </button>
          {sources.map((s) => (
            <button
              key={s.name}
              onClick={() => { setSource(s.name); setPage(1); }}
              className={`text-[9px] px-2 py-1 tracking-widest border transition-colors uppercase ${
                source === s.name
                  ? "text-accent border-accent bg-accent/5"
                  : `${SOURCE_COLORS[s.name] || "text-muted"} border-card-border hover:border-foreground/20`
              }`}
            >
              {s.name} ({s.count})
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setAnalyzedFilter(analyzedFilter === "true" ? "" : "true"); setPage(1); }}
              className={`text-[9px] px-2 py-1 tracking-widest border transition-colors ${
                analyzedFilter === "true" ? "text-bullish border-bullish/30 bg-bullish/5" : "text-muted border-card-border"
              }`}
            >
              ANALYZED
            </button>
            <button
              onClick={() => { setAnalyzedFilter(analyzedFilter === "false" ? "" : "false"); setPage(1); }}
              className={`text-[9px] px-2 py-1 tracking-widest border transition-colors ${
                analyzedFilter === "false" ? "text-neutral border-neutral/30 bg-neutral/5" : "text-muted border-card-border"
              }`}
            >
              PENDING
            </button>
            <span className="text-muted/30 mx-1">|</span>
            <button
              onClick={() => { setSort(sort === "newest" ? "oldest" : "newest"); setPage(1); }}
              className="text-[9px] px-2 py-1 tracking-widest border border-card-border text-muted hover:text-foreground transition-colors"
            >
              {sort === "newest" ? "NEWEST FIRST" : "OLDEST FIRST"}
            </button>
          </div>
        </div>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="p-8 text-center">
          <span className="text-[10px] text-muted tracking-widest animate-pulse">LOADING ARTICLES...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-muted text-xs">
            <span className="text-accent">&gt;</span> No articles found.
          </div>
        </div>
      ) : (
        <div className="divide-y divide-card-border">
          {articles.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-card-border flex items-center justify-between text-[10px] bg-card-bg/50">
          <span className="text-muted">
            PAGE {page} OF {totalPages} ({total.toLocaleString()} TOTAL)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-card-border text-muted hover:text-foreground disabled:opacity-30 tracking-widest"
            >
              PREV
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-card-border text-muted hover:text-foreground disabled:opacity-30 tracking-widest"
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArticleRow({ article }: { article: Article }) {
  const analyses = article.analyses || [];
  const topSentiment = analyses[0]?.sentiment;
  const dotColor =
    topSentiment === "bullish" ? "bg-bullish" :
    topSentiment === "bearish" ? "bg-bearish" :
    topSentiment === "neutral" ? "bg-neutral" : "bg-muted/30";

  const sourceColor = SOURCE_COLORS[article.source] || "text-muted";

  const timeStr = article.published_at
    ? formatTime(new Date(article.published_at))
    : "";

  const timeAgo = article.published_at
    ? getTimeAgo(new Date(article.published_at))
    : "";

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-6 py-3.5 hover:bg-card-bg/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className={`h-2 w-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-foreground leading-relaxed line-clamp-2 mb-1">
            {article.title}
          </div>
          {article.description && (
            <div className="text-[10px] text-muted leading-relaxed line-clamp-2 mb-2">
              {article.description}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] uppercase tracking-wider font-bold ${sourceColor}`}>
              {article.source}
            </span>
            {timeStr && (
              <span className="text-[10px] text-muted">{timeStr}</span>
            )}
            {timeAgo && (
              <span className="text-[9px] text-muted/50">({timeAgo})</span>
            )}
            {!article.analyzed && (
              <span className="text-[9px] px-1.5 py-0.5 bg-neutral/10 text-neutral">PENDING</span>
            )}
            {analyses.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {analyses.map((a, i) => {
                  const sentColor =
                    a.sentiment === "bullish" ? "text-bullish bg-bullish/10" :
                    a.sentiment === "bearish" ? "text-bearish bg-bearish/10" :
                    "text-neutral bg-neutral/10";
                  const dirIcon = a.predicted_direction === "up" ? "\u25B2" : a.predicted_direction === "down" ? "\u25BC" : "\u25C6";
                  return (
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 ${sentColor} font-bold`}>
                      {a.ticker} {dirIcon} {Math.round(a.confidence * 100)}%
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
