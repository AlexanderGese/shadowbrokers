"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  tickers: { ticker: string; name: string | null; sector: string | null; overall_sentiment: string; asset_type: string }[];
  topics: { topic: string; count: number }[];
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then(setResults)
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    router.push(path);
  }

  const sentimentColor = (s: string) =>
    s === "bullish" ? "text-bullish" : s === "bearish" ? "text-bearish" : "text-neutral";

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center border border-card-border bg-background px-2">
        <span className="text-[10px] text-muted mr-1">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="SEARCH (CTRL+K)"
          className="bg-transparent text-xs text-foreground py-1.5 w-40 lg:w-56 focus:outline-none placeholder:text-muted/50"
        />
      </div>

      {open && results && (results.tickers.length > 0 || results.topics.length > 0) && (
        <div className="absolute left-0 top-full mt-1 w-72 border border-card-border bg-card-bg z-50 max-h-80 overflow-y-auto">
          {results.tickers.length > 0 && (
            <>
              <div className="px-3 py-1.5 border-b border-card-border">
                <span className="text-[9px] text-muted tracking-widest">TICKERS</span>
              </div>
              {results.tickers.map((t) => (
                <button
                  key={t.ticker}
                  onClick={() => navigate(`/ticker/${t.ticker}`)}
                  className="w-full text-left px-3 py-2 hover:bg-card-border/30 transition-colors flex items-center gap-2"
                >
                  <span className="text-xs font-bold text-foreground w-12">{t.ticker}</span>
                  <span className="text-[10px] text-muted flex-1 truncate">{t.name}</span>
                  <span className={`text-[9px] ${sentimentColor(t.overall_sentiment)}`}>
                    {t.overall_sentiment.toUpperCase()}
                  </span>
                </button>
              ))}
            </>
          )}
          {results.topics.length > 0 && (
            <>
              <div className="px-3 py-1.5 border-b border-card-border">
                <span className="text-[9px] text-muted tracking-widest">TOPICS</span>
              </div>
              {results.topics.map((t) => (
                <button
                  key={t.topic}
                  onClick={() => navigate(`/topic/${encodeURIComponent(t.topic)}`)}
                  className="w-full text-left px-3 py-2 hover:bg-card-border/30 transition-colors flex items-center gap-2"
                >
                  <span className="text-[10px] text-accent flex-1">{t.topic}</span>
                  <span className="text-[9px] text-muted">{t.count} mentions</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
