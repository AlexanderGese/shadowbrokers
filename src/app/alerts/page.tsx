"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

interface AlertItem {
  id: string;
  ticker: string;
  condition: string;
  active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export default function AlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  async function toggleAlert(id: string, active: boolean) {
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !active } : a))
    );
  }

  async function deleteAlert(id: string) {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xs text-muted tracking-widest">LOADING ALERTS...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
            &larr; DASHBOARD
          </Link>
          <span className="text-card-border">|</span>
          <span className="text-xs text-muted tracking-widest">ALERTS</span>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="text-[10px] text-muted tracking-widest mb-3">
          YOUR ALERTS ({alerts.length})
        </div>

        {alerts.length === 0 ? (
          <div className="border border-card-border bg-card-bg p-8 text-center">
            <div className="text-muted text-xs">
              <span className="text-accent">&gt;</span> No alerts. Go to a ticker page to set one.
            </div>
          </div>
        ) : (
          <div className="space-y-px">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border border-card-border bg-card-bg p-4 flex items-center justify-between ${!alert.active ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <Link href={`/ticker/${alert.ticker}`} className="text-sm font-bold text-foreground hover:text-accent">
                    {alert.ticker}
                  </Link>
                  <span className={`text-[10px] px-2 py-0.5 uppercase tracking-wider ${
                    alert.condition === "bullish" ? "text-bullish bg-bullish/10" :
                    alert.condition === "bearish" ? "text-bearish bg-bearish/10" :
                    alert.condition === "danger" ? "text-bearish bg-bearish/10" :
                    alert.condition === "high_move" ? "text-neutral bg-neutral/10" :
                    alert.condition === "sentiment_flip" ? "text-accent bg-accent/10" :
                    "text-neutral bg-neutral/10"
                  }`}>
                    {alert.condition.replace(/_/g, " ")}
                  </span>
                  <span className={`text-[9px] ${alert.active ? "text-bullish" : "text-muted"}`}>
                    {alert.active ? "ACTIVE" : "PAUSED"}
                  </span>
                  {alert.last_triggered_at && (
                    <span className="text-[9px] text-muted">
                      Last: {new Date(alert.last_triggered_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlert(alert.id, alert.active)}
                    className="text-[10px] px-2 py-1 border border-card-border text-muted hover:text-foreground transition-colors tracking-widest"
                  >
                    {alert.active ? "PAUSE" : "RESUME"}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="text-[10px] px-2 py-1 border border-bearish/30 text-bearish hover:bg-bearish/10 transition-colors tracking-widest"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
