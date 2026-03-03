"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RSS_FEEDS, AI_CONFIG, ENV_KEYS } from "@/lib/config";

type Tab = "overview" | "users" | "data" | "system" | "analytics";

interface Stats {
  articles: number;
  analyses: number;
  tickers: number;
  cacheEntries: number;
  users: number;
}

interface RecentAnalysis {
  id: string;
  ticker: string;
  sentiment: string;
  confidence: number;
  created_at: string;
}

interface UserInfo {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface ArticleRow {
  id: string;
  title: string;
  source: string;
  published_at: string | null;
  analyzed: boolean;
  created_at: string;
}

interface AnalysisRow {
  id: string;
  ticker: string;
  sentiment: string;
  confidence: number;
  reasoning: string;
  topic: string | null;
  created_at: string;
}

interface AnalyticsData {
  accuracy: { totalPredictions: number; correctCount: number; percentCorrect: number };
  sourceBreakdown: { source: string; count: number }[];
  topTickers: { ticker: string; numArticles: number }[];
  sentimentDist: { bullish: number; bearish: number; neutral: number };
}

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "OVERVIEW" },
  { key: "users", label: "USERS" },
  { key: "data", label: "DATA" },
  { key: "system", label: "SYSTEM" },
  { key: "analytics", label: "ANALYTICS" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Users tab
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Data tab
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [articlesPage, setArticlesPage] = useState(1);
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [analysesTotal, setAnalysesTotal] = useState(0);
  const [analysesPage, setAnalysesPage] = useState(1);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataView, setDataView] = useState<"articles" | "analyses">("articles");
  const [reanalyzeTicker, setReanalyzeTicker] = useState("");
  const [purgeDays, setPurgeDays] = useState("30");

  // Analytics tab
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Environment check
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data.stats);
      setRecentAnalyses(data.recentAnalyses || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Check env vars client-side (they're only on server, so we check via naming)
    const status: Record<string, boolean> = {};
    for (const key of ENV_KEYS) {
      // Client can only see NEXT_PUBLIC_ vars
      if (key.startsWith("NEXT_PUBLIC_")) {
        status[key] = !!process.env[key];
      } else {
        status[key] = true; // Assume set — server-only vars can't be checked client-side
      }
    }
    setEnvStatus(status);
  }, [loadStats]);

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // ignore
    } finally {
      setUsersLoading(false);
    }
  }

  const loadArticles = useCallback(async (page: number) => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "browse_articles", page }),
      });
      const data = await res.json();
      setArticles(data.data || []);
      setArticlesTotal(data.total || 0);
      setArticlesPage(page);
    } catch {
      // ignore
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadAnalyses = useCallback(async (page: number) => {
    setDataLoading(true);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "browse_analyses", page }),
      });
      const data = await res.json();
      setAnalyses(data.data || []);
      setAnalysesTotal(data.total || 0);
      setAnalysesPage(page);
    } catch {
      // ignore
    } finally {
      setDataLoading(false);
    }
  }, []);

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    if (tab === "data" && articles.length === 0) loadArticles(1);
    if (tab === "analytics" && !analytics) loadAnalytics();
  }, [tab, users.length, articles.length, analytics, loadArticles]);

  async function runAction(endpoint: string, method: string, label: string) {
    setActionLoading(label);
    setActionStatus(null);
    try {
      const res = await fetch(endpoint, { method });
      const data = await res.json();
      if (data.success) {
        if (label === "analysis") {
          setActionStatus(`Analysis complete: ${data.rss?.fetched || 0} articles, ${data.analysis?.insights || 0} insights`);
        } else if (label === "pipeline") {
          setActionStatus(`Pipeline complete: ${data.rss?.fetched || 0} articles, ${data.analysis?.insights || 0} insights, ${data.accuracyChecked} accuracy checks, ${data.alertsTriggered} alerts`);
        } else if (label === "cache") {
          setActionStatus(`Cache cleared: ${data.cleared} entries removed`);
        }
        loadStats();
      } else {
        setActionStatus(`Error: ${data.error}`);
      }
    } catch {
      setActionStatus("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteArticle(id: string) {
    try {
      await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_article", id }),
      });
      loadArticles(articlesPage);
      loadStats();
    } catch {
      // ignore
    }
  }

  async function deleteAnalysis(id: string) {
    try {
      await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_analysis", id }),
      });
      loadAnalyses(analysesPage);
      loadStats();
    } catch {
      // ignore
    }
  }

  async function handleReanalyze() {
    if (!reanalyzeTicker.trim()) return;
    setActionLoading("reanalyze");
    setActionStatus(null);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reanalyze", ticker: reanalyzeTicker.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setActionStatus(`Re-analysis complete for ${reanalyzeTicker.toUpperCase()}: ${data.analyzed || 0} articles, ${data.insights || 0} insights`);
        setReanalyzeTicker("");
        loadStats();
      } else {
        setActionStatus(`Error: ${data.error}`);
      }
    } catch {
      setActionStatus("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePurge() {
    const days = parseInt(purgeDays);
    if (!days || days < 1) return;
    setActionLoading("purge");
    setActionStatus(null);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge_old", days }),
      });
      const data = await res.json();
      if (data.success) {
        setActionStatus(`Purged: ${data.articlesDeleted} articles, ${data.analysesDeleted} analyses older than ${days} days`);
        loadStats();
        loadArticles(1);
      } else {
        setActionStatus(`Error: ${data.error}`);
      }
    } catch {
      setActionStatus("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg px-6 py-4 border-t-2 border-t-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
              &larr; DASHBOARD
            </Link>
            <span className="text-card-border">|</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent pulse-dot" />
              <span className="text-xs text-accent tracking-widest font-bold">ADMIN PANEL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-card-border flex overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 md:px-6 py-3 text-[10px] tracking-widest font-bold transition-colors whitespace-nowrap ${
              tab === t.key
                ? "text-accent border-b-2 border-accent bg-accent/5"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <span className="text-xs text-muted tracking-widest">LOADING SYSTEM DATA...</span>
        </div>
      ) : (
        <>
          {/* Status Banner */}
          {actionStatus && (
            <div className="px-6 py-3 border-b border-card-border">
              <div className="text-[10px] text-accent bg-accent/5 border border-accent/20 px-3 py-2">
                {actionStatus}
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <>
              <div className="border-b border-card-border">
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">SYSTEM STATS</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5">
                  <StatBox label="ARTICLES" value={stats?.articles?.toString() || "0"} color="text-foreground" />
                  <StatBox label="ANALYSES" value={stats?.analyses?.toString() || "0"} color="text-accent" />
                  <StatBox label="TICKERS" value={stats?.tickers?.toString() || "0"} color="text-bullish" />
                  <StatBox label="CACHE" value={stats?.cacheEntries?.toString() || "0"} color="text-neutral" />
                  <StatBox label="USERS" value={stats?.users?.toString() || "0"} color="text-foreground" />
                </div>
              </div>

              <div className="border-b border-card-border">
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">ACTIONS</span>
                </div>
                <div className="px-6 py-4 flex flex-wrap gap-3">
                  <ActionButton
                    label="RUN ANALYSIS"
                    loadingLabel="RUNNING..."
                    loading={actionLoading === "analysis"}
                    disabled={actionLoading !== null}
                    onClick={() => runAction("/api/analyze", "POST", "analysis")}
                    color="accent"
                  />
                  <ActionButton
                    label="FULL PIPELINE"
                    loadingLabel="RUNNING..."
                    loading={actionLoading === "pipeline"}
                    disabled={actionLoading !== null}
                    onClick={() => runAction("/api/admin/cron", "POST", "pipeline")}
                    color="bullish"
                  />
                  <ActionButton
                    label="CLEAR CACHE"
                    loadingLabel="CLEARING..."
                    loading={actionLoading === "cache"}
                    disabled={actionLoading !== null}
                    onClick={() => runAction("/api/admin/cache", "DELETE", "cache")}
                    color="bearish"
                  />
                </div>
              </div>

              <div>
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">
                    RECENT ANALYSES ({recentAnalyses.length})
                  </span>
                </div>
                <div className="divide-y divide-card-border">
                  {recentAnalyses.map((a) => {
                    const sentColor =
                      a.sentiment === "bullish" ? "text-bullish" : a.sentiment === "bearish" ? "text-bearish" : "text-neutral";
                    return (
                      <div key={a.id} className="px-6 py-2 flex items-center gap-4 text-[10px] hover:bg-card-border/20 transition-colors">
                        <Link href={`/ticker/${a.ticker}`} className="font-bold text-foreground hover:text-accent w-16">
                          {a.ticker}
                        </Link>
                        <span className={`uppercase font-bold w-16 ${sentColor}`}>{a.sentiment}</span>
                        <span className="text-accent">{Math.round(a.confidence * 100)}%</span>
                        <span className="text-muted ml-auto">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                  {recentAnalyses.length === 0 && (
                    <div className="px-6 py-4 text-[10px] text-muted">No analyses yet.</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* USERS TAB */}
          {tab === "users" && (
            <div>
              <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
                <span className="text-[10px] text-muted tracking-widest">REGISTERED USERS ({users.length})</span>
                <button onClick={loadUsers} className="text-[10px] text-accent hover:text-accent/80 tracking-widest">
                  REFRESH
                </button>
              </div>
              {usersLoading ? (
                <div className="p-8 text-center text-xs text-muted">LOADING USERS...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-card-border text-muted tracking-widest">
                        <th className="px-4 py-2 text-left">EMAIL</th>
                        <th className="px-4 py-2 text-left">DISPLAY NAME</th>
                        <th className="px-4 py-2 text-left">CREATED</th>
                        <th className="px-4 py-2 text-left">LAST SIGN IN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-card-border/20 transition-colors">
                          <td className="px-4 py-2 text-foreground">{u.email}</td>
                          <td className="px-4 py-2 text-muted">{u.display_name || "—"}</td>
                          <td className="px-4 py-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-muted">
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-muted text-center">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DATA TAB */}
          {tab === "data" && (
            <div>
              {/* Sub-nav */}
              <div className="border-b border-card-border flex">
                <button
                  onClick={() => { setDataView("articles"); if (articles.length === 0) loadArticles(1); }}
                  className={`px-4 py-2 text-[10px] tracking-widest ${dataView === "articles" ? "text-accent border-b border-accent" : "text-muted hover:text-foreground"}`}
                >
                  ARTICLES
                </button>
                <button
                  onClick={() => { setDataView("analyses"); if (analyses.length === 0) loadAnalyses(1); }}
                  className={`px-4 py-2 text-[10px] tracking-widest ${dataView === "analyses" ? "text-accent border-b border-accent" : "text-muted hover:text-foreground"}`}
                >
                  ANALYSES
                </button>
              </div>

              {dataLoading ? (
                <div className="p-8 text-center text-xs text-muted">LOADING...</div>
              ) : dataView === "articles" ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-card-border text-muted tracking-widest">
                          <th className="px-4 py-2 text-left">TITLE</th>
                          <th className="px-4 py-2 text-left">SOURCE</th>
                          <th className="px-4 py-2 text-left">DATE</th>
                          <th className="px-4 py-2 text-left">ANALYZED</th>
                          <th className="px-4 py-2 text-left"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {articles.map((a) => (
                          <tr key={a.id} className="hover:bg-card-border/20 transition-colors">
                            <td className="px-4 py-2 text-foreground max-w-xs truncate">{a.title}</td>
                            <td className="px-4 py-2 text-muted uppercase">{a.source}</td>
                            <td className="px-4 py-2 text-muted">
                              {a.published_at ? new Date(a.published_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-2">
                              <span className={a.analyzed ? "text-bullish" : "text-bearish"}>
                                {a.analyzed ? "YES" : "NO"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => deleteArticle(a.id)}
                                className="text-bearish hover:text-bearish/80 tracking-widest"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={articlesPage}
                    total={articlesTotal}
                    perPage={20}
                    onPage={(p) => loadArticles(p)}
                  />
                </>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-card-border text-muted tracking-widest">
                          <th className="px-4 py-2 text-left">TICKER</th>
                          <th className="px-4 py-2 text-left">SENTIMENT</th>
                          <th className="px-4 py-2 text-left">CONFIDENCE</th>
                          <th className="px-4 py-2 text-left">TOPIC</th>
                          <th className="px-4 py-2 text-left">DATE</th>
                          <th className="px-4 py-2 text-left"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {analyses.map((a) => {
                          const sentColor =
                            a.sentiment === "bullish" ? "text-bullish" : a.sentiment === "bearish" ? "text-bearish" : "text-neutral";
                          return (
                            <tr key={a.id} className="hover:bg-card-border/20 transition-colors">
                              <td className="px-4 py-2 font-bold text-foreground">{a.ticker}</td>
                              <td className={`px-4 py-2 uppercase font-bold ${sentColor}`}>{a.sentiment}</td>
                              <td className="px-4 py-2 text-accent">{Math.round(a.confidence * 100)}%</td>
                              <td className="px-4 py-2 text-muted max-w-xs truncate">{a.topic || "—"}</td>
                              <td className="px-4 py-2 text-muted">{new Date(a.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => deleteAnalysis(a.id)}
                                  className="text-bearish hover:text-bearish/80 tracking-widest"
                                >
                                  DELETE
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={analysesPage}
                    total={analysesTotal}
                    perPage={20}
                    onPage={(p) => loadAnalyses(p)}
                  />
                </>
              )}

              {/* Data Actions */}
              <div className="border-t border-card-border">
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">DATA ACTIONS</span>
                </div>
                <div className="px-6 py-4 space-y-4">
                  {/* Re-analyze Ticker */}
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={reanalyzeTicker}
                      onChange={(e) => setReanalyzeTicker(e.target.value)}
                      placeholder="TICKER"
                      className="bg-background border border-card-border text-foreground text-[10px] px-3 py-2 w-28 tracking-widest uppercase placeholder:text-muted"
                    />
                    <button
                      onClick={handleReanalyze}
                      disabled={actionLoading !== null || !reanalyzeTicker.trim()}
                      className="text-[10px] px-4 py-2 border border-accent/30 text-accent hover:bg-accent/10 transition-colors tracking-widest disabled:opacity-50"
                    >
                      {actionLoading === "reanalyze" ? "RUNNING..." : "RE-ANALYZE"}
                    </button>
                  </div>

                  {/* Purge Old Data */}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={purgeDays}
                      onChange={(e) => setPurgeDays(e.target.value)}
                      min="1"
                      className="bg-background border border-card-border text-foreground text-[10px] px-3 py-2 w-20 tracking-widest"
                    />
                    <span className="text-[10px] text-muted">DAYS</span>
                    <button
                      onClick={handlePurge}
                      disabled={actionLoading !== null}
                      className="text-[10px] px-4 py-2 border border-bearish/30 text-bearish hover:bg-bearish/10 transition-colors tracking-widest disabled:opacity-50"
                    >
                      {actionLoading === "purge" ? "PURGING..." : "PURGE OLD DATA"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {tab === "system" && (
            <div>
              {/* RSS Sources */}
              <div className="border-b border-card-border">
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">RSS SOURCES ({RSS_FEEDS.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-card-border text-muted tracking-widest">
                        <th className="px-4 py-2 text-left">NAME</th>
                        <th className="px-4 py-2 text-left">URL</th>
                        <th className="px-4 py-2 text-left">SOURCE KEY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {RSS_FEEDS.map((f) => (
                        <tr key={f.source} className="hover:bg-card-border/20 transition-colors">
                          <td className="px-4 py-2 text-foreground font-bold">{f.name}</td>
                          <td className="px-4 py-2 text-muted max-w-sm truncate">{f.url}</td>
                          <td className="px-4 py-2 text-accent uppercase">{f.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Config */}
              <div className="border-b border-card-border">
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">AI CONFIGURATION</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4">
                  <StatBox label="MODEL" value={AI_CONFIG.model} color="text-accent" />
                  <StatBox label="TEMPERATURE" value={AI_CONFIG.temperature.toString()} color="text-foreground" />
                  <StatBox label="BATCH SIZE" value={AI_CONFIG.batchSize.toString()} color="text-foreground" />
                  <StatBox label="MAX TOKENS" value={AI_CONFIG.maxTokens.toLocaleString()} color="text-foreground" />
                </div>
              </div>

              {/* Environment Status */}
              <div className="border-b border-card-border">
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">ENVIRONMENT VARIABLES</span>
                </div>
                <div className="divide-y divide-card-border">
                  {ENV_KEYS.map((key) => (
                    <div key={key} className="px-6 py-2 flex items-center justify-between text-[10px]">
                      <span className="text-foreground font-mono">{key}</span>
                      <span className={envStatus[key] ? "text-bullish" : "text-bearish"}>
                        {envStatus[key] ? "SET" : "UNSET"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cache Stats */}
              <div>
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">CACHE</span>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-muted">PRICE CACHE ENTRIES:</span>
                    <span className="text-sm font-bold text-foreground">{stats?.cacheEntries || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {tab === "analytics" && (
            <div>
              {analyticsLoading ? (
                <div className="p-8 text-center text-xs text-muted">LOADING ANALYTICS...</div>
              ) : analytics ? (
                <>
                  {/* Accuracy */}
                  <div className="border-b border-card-border">
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">PREDICTION ACCURACY</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <StatBox label="ACCURACY" value={`${analytics.accuracy.percentCorrect}%`} color="text-accent" />
                      <StatBox label="CORRECT" value={analytics.accuracy.correctCount.toString()} color="text-bullish" />
                      <StatBox label="TOTAL" value={analytics.accuracy.totalPredictions.toString()} color="text-foreground" />
                    </div>
                  </div>

                  {/* Source Breakdown */}
                  <div className="border-b border-card-border">
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">
                        ARTICLES BY SOURCE ({analytics.sourceBreakdown.length})
                      </span>
                    </div>
                    <div className="divide-y divide-card-border">
                      {analytics.sourceBreakdown.map((s) => (
                        <div key={s.source} className="px-6 py-2 flex items-center justify-between text-[10px]">
                          <span className="text-foreground uppercase font-bold">{s.source}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-1 bg-card-border rounded overflow-hidden">
                              <div
                                className="h-full bg-accent rounded"
                                style={{
                                  width: `${Math.min(100, (s.count / (analytics.sourceBreakdown[0]?.count || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-accent w-12 text-right">{s.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Tickers */}
                  <div className="border-b border-card-border">
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">TOP TICKERS BY ARTICLES</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                      {analytics.topTickers.map((t) => (
                        <div key={t.ticker} className="border-r border-b border-card-border px-4 py-2">
                          <Link href={`/ticker/${t.ticker}`} className="text-xs font-bold text-foreground hover:text-accent">
                            {t.ticker}
                          </Link>
                          <div className="text-[10px] text-muted">{t.numArticles} articles</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment Distribution */}
                  <div>
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">SENTIMENT DISTRIBUTION</span>
                    </div>
                    <div className="grid grid-cols-3">
                      <StatBox label="BULLISH" value={analytics.sentimentDist.bullish.toString()} color="text-bullish" />
                      <StatBox label="BEARISH" value={analytics.sentimentDist.bearish.toString()} color="text-bearish" />
                      <StatBox label="NEUTRAL" value={analytics.sentimentDist.neutral.toString()} color="text-neutral" />
                    </div>
                    {(() => {
                      const total = analytics.sentimentDist.bullish + analytics.sentimentDist.bearish + analytics.sentimentDist.neutral;
                      if (total === 0) return null;
                      return (
                        <div className="px-6 py-3">
                          <div className="flex h-2 rounded overflow-hidden">
                            <div className="bg-bullish" style={{ width: `${(analytics.sentimentDist.bullish / total) * 100}%` }} />
                            <div className="bg-neutral" style={{ width: `${(analytics.sentimentDist.neutral / total) * 100}%` }} />
                            <div className="bg-bearish" style={{ width: `${(analytics.sentimentDist.bearish / total) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-muted">No analytics data available.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-r border-b border-card-border px-4 py-3 last:border-r-0">
      <div className="text-[9px] text-muted tracking-wider">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  loadingLabel,
  loading,
  disabled,
  onClick,
  color,
}: {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-[10px] px-4 py-2 border border-${color}/30 text-${color} hover:bg-${color}/10 transition-colors tracking-widest disabled:opacity-50`}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

function Pagination({
  page,
  total,
  perPage,
  onPage,
}: {
  page: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-3 border-t border-card-border flex items-center justify-between text-[10px]">
      <span className="text-muted">
        PAGE {page} OF {totalPages} ({total} TOTAL)
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 border border-card-border text-muted hover:text-foreground disabled:opacity-30 tracking-widest"
        >
          PREV
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 border border-card-border text-muted hover:text-foreground disabled:opacity-30 tracking-widest"
        >
          NEXT
        </button>
      </div>
    </div>
  );
}
