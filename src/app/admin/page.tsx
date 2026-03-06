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
  plan: string;
  renewal_date: string | null;
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
  pipelineHealth: { lastRunAt: string | null; runsLast24h: number; successRate: number };
  accuracyBySector: { sector: string; total: number; correct: number; pct: number }[];
  articleTrend: { date: string; count: number }[];
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
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", display_name: "", plan: "free" });
  const [createUserMsg, setCreateUserMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editRenewal, setEditRenewal] = useState("");
  const [userActionMsg, setUserActionMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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
  const [analyticsRange, setAnalyticsRange] = useState<"all" | "7d" | "30d">("7d");

  // Discord webhook
  const [discordConfigured, setDiscordConfigured] = useState(false);

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
    // Check Discord webhook status
    fetch("/api/admin/webhook")
      .then((r) => r.json())
      .then((d) => setDiscordConfigured(d.configured))
      .catch(() => {});
  }, [loadStats]);

  async function testWebhook() {
    setActionLoading("webhook");
    setActionStatus(null);
    try {
      const res = await fetch("/api/admin/webhook", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActionStatus("Discord webhook test sent successfully!");
      } else {
        setActionStatus("Webhook test failed — check URL configuration.");
      }
    } catch {
      setActionStatus("Network error");
    } finally {
      setActionLoading(null);
    }
  }

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

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreateUserMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setCreateUserMsg({ type: "ok", text: `User ${data.user.email} created` });
        setNewUser({ email: "", password: "", display_name: "", plan: "free" });
        setShowCreateUser(false);
        loadUsers();
      } else {
        setCreateUserMsg({ type: "err", text: data.error });
      }
    } catch {
      setCreateUserMsg({ type: "err", text: "Network error" });
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setUserActionMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUserActionMsg({ type: "ok", text: `User ${email} deleted` });
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        setUserActionMsg({ type: "err", text: data.error });
      }
    } catch {
      setUserActionMsg({ type: "err", text: "Failed to delete user" });
    }
  }

  async function updateSubscription(userId: string) {
    setUserActionMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          plan: editPlan,
          renewal_date: editRenewal || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUserActionMsg({ type: "ok", text: "Subscription updated" });
        setEditingUser(null);
        loadUsers();
      } else {
        setUserActionMsg({ type: "err", text: data.error });
      }
    } catch {
      setUserActionMsg({ type: "err", text: "Failed to update" });
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

  const loadAnalytics = useCallback(async (range: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      const data = await res.json();
      setAnalytics(data);
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    if (tab === "data" && articles.length === 0) loadArticles(1);
    if (tab === "analytics") loadAnalytics(analyticsRange);
  }, [tab, users.length, articles.length, analyticsRange, loadArticles, loadAnalytics]);

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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateUser(!showCreateUser)}
                    className="text-[10px] px-3 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors tracking-widest"
                  >
                    + CREATE USER
                  </button>
                  <button onClick={loadUsers} className="text-[10px] text-accent hover:text-accent/80 tracking-widest">
                    REFRESH
                  </button>
                </div>
              </div>

              {/* Status messages */}
              {(createUserMsg || userActionMsg) && (
                <div className="px-4 py-2 border-b border-card-border">
                  {createUserMsg && (
                    <div className={`text-[10px] ${createUserMsg.type === "ok" ? "text-bullish" : "text-bearish"}`}>
                      [{createUserMsg.type === "ok" ? "OK" : "ERR"}] {createUserMsg.text}
                    </div>
                  )}
                  {userActionMsg && (
                    <div className={`text-[10px] ${userActionMsg.type === "ok" ? "text-bullish" : "text-bearish"}`}>
                      [{userActionMsg.type === "ok" ? "OK" : "ERR"}] {userActionMsg.text}
                    </div>
                  )}
                </div>
              )}

              {/* Create User Form */}
              {showCreateUser && (
                <div className="p-4 border-b border-card-border bg-background/50">
                  <form onSubmit={createUser} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-muted tracking-widest block mb-1">USERNAME</label>
                        <input
                          type="text"
                          value={newUser.display_name}
                          onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                          placeholder="agent_smith"
                          className="w-full bg-background border border-card-border px-3 py-1.5 text-[10px] text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted tracking-widest block mb-1">EMAIL *</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          required
                          placeholder="user@email.com"
                          className="w-full bg-background border border-card-border px-3 py-1.5 text-[10px] text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted tracking-widest block mb-1">PASSWORD *</label>
                        <input
                          type="text"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          required
                          minLength={6}
                          placeholder="min 6 chars"
                          className="w-full bg-background border border-card-border px-3 py-1.5 text-[10px] text-foreground focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted tracking-widest block mb-1">PLAN</label>
                        <select
                          value={newUser.plan}
                          onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
                          className="w-full bg-background border border-card-border px-3 py-1.5 text-[10px] text-foreground focus:outline-none"
                        >
                          <option value="free">FREE</option>
                          <option value="pro">PRO</option>
                          <option value="ultra">ULTRA</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="text-[10px] px-4 py-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors tracking-widest"
                      >
                        CREATE
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateUser(false)}
                        className="text-[10px] px-4 py-1.5 border border-card-border text-muted hover:text-foreground transition-colors tracking-widest"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {usersLoading ? (
                <div className="p-8 text-center text-xs text-muted">LOADING USERS...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-card-border text-muted tracking-widest">
                        <th className="px-3 py-2 text-left">USERNAME</th>
                        <th className="px-3 py-2 text-left">EMAIL</th>
                        <th className="px-3 py-2 text-left">PLAN</th>
                        <th className="px-3 py-2 text-left">RENEWAL</th>
                        <th className="px-3 py-2 text-left">CREATED</th>
                        <th className="px-3 py-2 text-left">LAST LOGIN</th>
                        <th className="px-3 py-2 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-card-border/20 transition-colors group">
                          <td className="px-3 py-2 text-foreground font-bold">{u.display_name || "—"}</td>
                          <td className="px-3 py-2 text-muted">{u.email}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 text-[9px] tracking-widest border ${
                              u.plan === "ultra" ? "bg-accent/10 text-accent border-accent/30" :
                              u.plan === "pro" ? "bg-bullish/10 text-bullish border-bullish/30" :
                              "bg-card-border/20 text-muted border-card-border"
                            }`}>
                              {u.plan.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-muted">
                            {u.renewal_date ? new Date(u.renewal_date).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-muted">
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingUser(editingUser === u.id ? null : u.id);
                                  setEditPlan(u.plan);
                                  setEditRenewal(u.renewal_date || "");
                                }}
                                className="text-[9px] px-2 py-1 border border-card-border text-muted hover:text-accent hover:border-accent/30 transition-colors tracking-widest"
                              >
                                EDIT
                              </button>
                              <button
                                onClick={() => deleteUser(u.id, u.email || "")}
                                className="text-[9px] px-2 py-1 border border-bearish/20 text-bearish/50 hover:text-bearish hover:border-bearish/40 transition-colors tracking-widest"
                              >
                                DEL
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.map((u) =>
                        editingUser === u.id ? (
                          <tr key={`edit-${u.id}`} className="bg-background/50">
                            <td colSpan={7} className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <div>
                                  <label className="text-[9px] text-muted tracking-widest block mb-1">PLAN</label>
                                  <select
                                    value={editPlan}
                                    onChange={(e) => setEditPlan(e.target.value)}
                                    className="bg-background border border-card-border px-2 py-1 text-[10px] text-foreground focus:outline-none"
                                  >
                                    <option value="free">FREE</option>
                                    <option value="pro">PRO</option>
                                    <option value="ultra">ULTRA</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] text-muted tracking-widest block mb-1">RENEWAL DATE</label>
                                  <input
                                    type="date"
                                    value={editRenewal ? editRenewal.split("T")[0] : ""}
                                    onChange={(e) => setEditRenewal(e.target.value ? new Date(e.target.value).toISOString() : "")}
                                    className="bg-background border border-card-border px-2 py-1 text-[10px] text-foreground focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-end gap-1 pt-3">
                                  <button
                                    onClick={() => updateSubscription(u.id)}
                                    className="text-[9px] px-3 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors tracking-widest"
                                  >
                                    SAVE
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="text-[9px] px-3 py-1 border border-card-border text-muted hover:text-foreground transition-colors tracking-widest"
                                  >
                                    CANCEL
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null
                      )}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 text-muted text-center">No users found.</td>
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
              <div className="border-b border-card-border">
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

              {/* Discord Webhook */}
              <div>
                <div className="px-4 py-2 border-b border-card-border">
                  <span className="text-[10px] text-muted tracking-widest">DISCORD WEBHOOK</span>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted">STATUS:</span>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${discordConfigured ? "bg-bullish" : "bg-bearish"}`} />
                      <span className={`text-[10px] font-bold ${discordConfigured ? "text-bullish" : "text-bearish"}`}>
                        {discordConfigured ? "CONFIGURED" : "NOT SET"}
                      </span>
                    </div>
                  </div>
                  {!discordConfigured && (
                    <div className="text-[10px] text-muted">
                      Set <span className="font-mono text-foreground">DISCORD_WEBHOOK_URL</span> in your environment variables to enable Discord notifications.
                    </div>
                  )}
                  <button
                    onClick={testWebhook}
                    disabled={!discordConfigured || actionLoading !== null}
                    className="text-[10px] px-4 py-2 border border-accent/30 text-accent hover:bg-accent/10 transition-colors tracking-widest disabled:opacity-50"
                  >
                    {actionLoading === "webhook" ? "SENDING..." : "TEST WEBHOOK"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS TAB */}
          {tab === "analytics" && (
            <div className="relative">
              {/* Range filter bar */}
              <div className="px-4 py-2 border-b border-card-border flex items-center justify-between">
                <span className="text-[10px] text-muted tracking-widest">
                  {analyticsRange === "7d" ? "LAST 7 DAYS" : analyticsRange === "30d" ? "LAST 30 DAYS" : "ALL TIME"}
                </span>
                <div className="flex gap-1">
                  {(["7d", "30d", "all"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnalyticsRange(r)}
                      className={`px-3 py-1 text-[10px] tracking-widest font-bold border transition-colors ${
                        analyticsRange === r
                          ? "text-accent border-accent bg-accent/5"
                          : "text-muted border-card-border hover:text-foreground hover:border-foreground/20"
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {analyticsLoading && (
                <div className="absolute inset-0 top-[37px] bg-background/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-[10px] text-accent tracking-widest animate-pulse">LOADING...</span>
                </div>
              )}

              {analytics ? (
                <>
                  {/* Pipeline Health */}
                  {analytics.pipelineHealth && (
                    <div className="border-b border-card-border">
                      <div className="px-4 py-2 border-b border-card-border">
                        <span className="text-[10px] text-muted tracking-widest">PIPELINE HEALTH</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="border-r border-b border-card-border px-4 py-3">
                          <div className="text-[9px] text-muted tracking-wider">LAST RUN</div>
                          <div className="text-sm font-bold text-foreground">
                            {analytics.pipelineHealth.lastRunAt
                              ? new Date(analytics.pipelineHealth.lastRunAt).toLocaleString()
                              : "NEVER"}
                          </div>
                        </div>
                        <div className="border-r border-b border-card-border px-4 py-3">
                          <div className="text-[9px] text-muted tracking-wider">RUNS (24H)</div>
                          <div className={`text-xl font-bold ${analytics.pipelineHealth.runsLast24h > 0 ? "text-bullish" : "text-bearish"}`}>
                            {analytics.pipelineHealth.runsLast24h}
                          </div>
                        </div>
                        <div className="border-b border-card-border px-4 py-3">
                          <div className="text-[9px] text-muted tracking-wider">7D UPTIME</div>
                          <div className={`text-xl font-bold ${analytics.pipelineHealth.successRate >= 80 ? "text-bullish" : analytics.pipelineHealth.successRate >= 50 ? "text-neutral" : "text-bearish"}`}>
                            {analytics.pipelineHealth.successRate}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Accuracy */}
                  <div className="border-b border-card-border">
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">PREDICTION ACCURACY</span>
                    </div>
                    <div className="flex items-center gap-6 px-6 py-4">
                      {/* Accuracy ring */}
                      <div className="relative flex-shrink-0">
                        <svg width="72" height="72" viewBox="0 0 72 72">
                          <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="4" className="text-card-border" />
                          <circle
                            cx="36" cy="36" r="30" fill="none" strokeWidth="4"
                            className="text-accent"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeDasharray={`${(analytics.accuracy.percentCorrect / 100) * 188.5} 188.5`}
                            transform="rotate(-90 36 36)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-accent">{analytics.accuracy.percentCorrect}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[10px]">
                        <span className="text-muted tracking-widest">CORRECT</span>
                        <span className="text-bullish font-bold">{analytics.accuracy.correctCount}</span>
                        <span className="text-muted tracking-widest">INCORRECT</span>
                        <span className="text-bearish font-bold">{analytics.accuracy.totalPredictions - analytics.accuracy.correctCount}</span>
                        <span className="text-muted tracking-widest">TOTAL</span>
                        <span className="text-foreground font-bold">{analytics.accuracy.totalPredictions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy By Sector */}
                  {analytics.accuracyBySector && analytics.accuracyBySector.length > 0 && (
                    <div className="border-b border-card-border">
                      <div className="px-4 py-2 border-b border-card-border">
                        <span className="text-[10px] text-muted tracking-widest">ACCURACY BY SECTOR</span>
                      </div>
                      <div className="divide-y divide-card-border">
                        {analytics.accuracyBySector.map((s) => (
                          <div key={s.sector} className="px-6 py-2 flex items-center justify-between text-[10px] hover:bg-card-border/10 transition-colors">
                            <span className="text-foreground uppercase font-bold w-32 truncate">{s.sector}</span>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <div className="w-40 h-1.5 bg-card-border rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${s.pct >= 50 ? "bg-bullish" : "bg-bearish"}`}
                                  style={{ width: `${Math.min(100, s.pct)}%` }}
                                />
                              </div>
                              <span className={`w-12 text-right font-bold ${s.pct >= 50 ? "text-bullish" : "text-bearish"}`}>
                                {s.pct}%
                              </span>
                              <span className="text-muted w-16 text-right">{s.correct}/{s.total}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Breakdown */}
                  <div className="border-b border-card-border">
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">
                        ARTICLES BY SOURCE ({analytics.sourceBreakdown.reduce((sum, s) => sum + s.count, 0)} TOTAL)
                      </span>
                    </div>
                    {analytics.sourceBreakdown.length > 0 ? (
                      <div className="divide-y divide-card-border">
                        {analytics.sourceBreakdown.map((s) => (
                          <div key={s.source} className="px-6 py-2 flex items-center justify-between text-[10px] hover:bg-card-border/10 transition-colors">
                            <span className="text-foreground uppercase font-bold w-32">{s.source}</span>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <div className="w-40 h-1.5 bg-card-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-accent rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, (s.count / (analytics.sourceBreakdown[0]?.count || 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-accent w-12 text-right font-bold">{s.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-4 text-[10px] text-muted">No articles in this time range.</div>
                    )}
                  </div>

                  {/* Article Ingestion Trend */}
                  {analytics.articleTrend && analytics.articleTrend.length > 0 && (
                    <div className="border-b border-card-border">
                      <div className="px-4 py-2 border-b border-card-border">
                        <span className="text-[10px] text-muted tracking-widest">ARTICLE INGESTION TREND</span>
                      </div>
                      <div className="px-6 py-4">
                        <div className="flex items-end gap-px" style={{ height: "100px" }}>
                          {(() => {
                            const maxCount = Math.max(...analytics.articleTrend.map((d) => d.count), 1);
                            return analytics.articleTrend.map((d) => {
                              const h = (d.count / maxCount) * 100;
                              return (
                                <div
                                  key={d.date}
                                  className="flex-1 flex flex-col justify-end min-w-[3px] group relative"
                                  style={{ height: "100%" }}
                                >
                                  <div className="bg-accent rounded-t-sm" style={{ height: `${h}%` }} />
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card-bg border border-card-border px-2 py-1 text-[9px] text-foreground whitespace-nowrap z-10">
                                    {d.date}: {d.count} articles
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                        <div className="flex justify-between text-[9px] text-muted mt-1">
                          <span>{analytics.articleTrend[0]?.date}</span>
                          <span>{analytics.articleTrend[analytics.articleTrend.length - 1]?.date}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Tickers */}
                  <div className="border-b border-card-border">
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">
                        TOP TICKERS ({analytics.topTickers.length})
                      </span>
                    </div>
                    {analytics.topTickers.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                        {analytics.topTickers.map((t, i) => (
                          <div key={t.ticker} className="border-r border-b border-card-border px-4 py-2 hover:bg-card-border/10 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-muted">{i + 1}.</span>
                              <Link href={`/ticker/${t.ticker}`} className="text-xs font-bold text-foreground hover:text-accent transition-colors">
                                {t.ticker}
                              </Link>
                            </div>
                            <div className="text-[10px] text-muted ml-4">{t.numArticles} analyses</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-4 text-[10px] text-muted">No ticker data in this time range.</div>
                    )}
                  </div>

                  {/* Sentiment Distribution */}
                  <div>
                    <div className="px-4 py-2 border-b border-card-border">
                      <span className="text-[10px] text-muted tracking-widest">SENTIMENT DISTRIBUTION</span>
                    </div>
                    {(() => {
                      const total = analytics.sentimentDist.bullish + analytics.sentimentDist.bearish + analytics.sentimentDist.neutral;
                      if (total === 0) {
                        return <div className="px-6 py-4 text-[10px] text-muted">No sentiment data in this time range.</div>;
                      }
                      const bullPct = Math.round((analytics.sentimentDist.bullish / total) * 100);
                      const bearPct = Math.round((analytics.sentimentDist.bearish / total) * 100);
                      const neutPct = 100 - bullPct - bearPct;
                      return (
                        <>
                          <div className="grid grid-cols-3">
                            <StatBox label="BULLISH" value={`${analytics.sentimentDist.bullish} (${bullPct}%)`} color="text-bullish" />
                            <StatBox label="BEARISH" value={`${analytics.sentimentDist.bearish} (${bearPct}%)`} color="text-bearish" />
                            <StatBox label="NEUTRAL" value={`${analytics.sentimentDist.neutral} (${neutPct}%)`} color="text-neutral" />
                          </div>
                          <div className="px-6 py-3">
                            <div className="flex h-2.5 rounded-full overflow-hidden">
                              <div className="bg-bullish transition-all duration-300" style={{ width: `${bullPct}%` }} />
                              <div className="bg-neutral transition-all duration-300" style={{ width: `${neutPct}%` }} />
                              <div className="bg-bearish transition-all duration-300" style={{ width: `${bearPct}%` }} />
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              ) : !analyticsLoading ? (
                <div className="p-8 text-center text-xs text-muted">No analytics data available.</div>
              ) : null}
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
