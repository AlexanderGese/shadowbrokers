"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import type { PriceData } from "@/lib/types";

interface Position {
  ticker: string;
  shares: number;
  avg_price: number;
  price?: PriceData;
  sentiment?: string;
}

export default function PortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ticker: "", shares: "", avg_price: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    loadPositions();
  }, [user, authLoading, router]);

  async function loadPositions() {
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      const pos = data.positions || [];

      if (pos.length > 0) {
        const tickers = pos.map((p: Position) => p.ticker);
        const [priceRes, tickerRes] = await Promise.all([
          fetch(`/api/prices?tickers=${tickers.join(",")}`),
          fetch("/api/tickers?limit=100"),
        ]);
        const priceData = await priceRes.json();
        const tickerData = await tickerRes.json();

        const sentMap = new Map<string, string>();
        for (const t of tickerData.tickers || []) {
          sentMap.set(t.ticker, t.overall_sentiment);
        }

        setPositions(
          pos.map((p: Position) => ({
            ...p,
            price: priceData.prices?.[p.ticker],
            sentiment: sentMap.get(p.ticker),
          }))
        );
      } else {
        setPositions([]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function addPosition(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || "Failed");
      return;
    }
    setForm({ ticker: "", shares: "", avg_price: "" });
    setShowForm(false);
    setLoading(true);
    loadPositions();
  }

  async function removePosition(ticker: string) {
    await fetch("/api/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    setPositions((prev) => prev.filter((p) => p.ticker !== ticker));
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xs text-muted tracking-widest">LOADING PORTFOLIO...</span>
      </div>
    );
  }

  const totalValue = positions.reduce((s, p) => s + (p.price?.currentPrice || p.avg_price) * p.shares, 0);
  const totalCost = positions.reduce((s, p) => s + p.avg_price * p.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-muted hover:text-accent transition-colors">
              &larr; DASHBOARD
            </Link>
            <span className="text-card-border">|</span>
            <span className="text-xs text-muted tracking-widest">PORTFOLIO</span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[10px] px-3 py-1 border border-accent/30 text-accent hover:bg-accent/10 transition-colors tracking-widest"
          >
            + ADD POSITION
          </button>
        </div>
      </header>

      {/* Summary */}
      <div className="border-b border-card-border bg-card-bg px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">TOTAL VALUE</div>
            <div className="text-lg font-bold text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">TOTAL COST</div>
            <div className="text-lg font-bold text-foreground">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">P&L</div>
            <div className={`text-lg font-bold ${totalPnl >= 0 ? "text-bullish" : "text-bearish"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="border border-card-border bg-background px-3 py-2">
            <div className="text-[10px] text-muted tracking-wider">P&L %</div>
            <div className={`text-lg font-bold ${totalPnlPct >= 0 ? "text-bullish" : "text-bearish"}`}>
              {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Add Position Form */}
      {showForm && (
        <div className="border-b border-card-border bg-card-bg px-6 py-4">
          <form onSubmit={addPosition} className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-[10px] text-muted tracking-widest block mb-1">TICKER</label>
              <input
                type="text"
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                required
                className="bg-background border border-card-border px-3 py-1.5 text-xs text-foreground w-24 focus:border-accent focus:outline-none"
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted tracking-widest block mb-1">SHARES</label>
              <input
                type="number"
                step="0.01"
                value={form.shares}
                onChange={(e) => setForm({ ...form, shares: e.target.value })}
                required
                className="bg-background border border-card-border px-3 py-1.5 text-xs text-foreground w-24 focus:border-accent focus:outline-none"
                placeholder="10"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted tracking-widest block mb-1">AVG PRICE</label>
              <input
                type="number"
                step="0.01"
                value={form.avg_price}
                onChange={(e) => setForm({ ...form, avg_price: e.target.value })}
                required
                className="bg-background border border-card-border px-3 py-1.5 text-xs text-foreground w-28 focus:border-accent focus:outline-none"
                placeholder="150.00"
              />
            </div>
            <button
              type="submit"
              className="text-[10px] px-4 py-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors tracking-widest"
            >
              ADD
            </button>
            {formError && <span className="text-[10px] text-bearish">{formError}</span>}
          </form>
        </div>
      )}

      {/* Positions Table */}
      <div className="px-6 py-4">
        {positions.length === 0 ? (
          <div className="border border-card-border bg-card-bg p-8 text-center">
            <div className="text-muted text-xs">
              <span className="text-accent">&gt;</span> No positions yet. Add your first position above.
            </div>
          </div>
        ) : (
          <div className="border border-card-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-card-bg">
                  <th className="text-left px-3 py-2 text-[10px] text-muted tracking-widest">TICKER</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted tracking-widest">SHARES</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted tracking-widest">AVG COST</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted tracking-widest">PRICE</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted tracking-widest">VALUE</th>
                  <th className="text-right px-3 py-2 text-[10px] text-muted tracking-widest">P&L</th>
                  <th className="text-center px-3 py-2 text-[10px] text-muted tracking-widest">SIGNAL</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const currentPrice = p.price?.currentPrice || p.avg_price;
                  const value = currentPrice * p.shares;
                  const pnl = (currentPrice - p.avg_price) * p.shares;
                  const pnlPct = ((currentPrice - p.avg_price) / p.avg_price) * 100;
                  const sentColor = p.sentiment === "bullish" ? "text-bullish" : p.sentiment === "bearish" ? "text-bearish" : "text-neutral";

                  return (
                    <tr key={p.ticker} className="border-b border-card-border hover:bg-card-border/30 transition-colors">
                      <td className="px-3 py-2">
                        <Link href={`/ticker/${p.ticker}`} className="font-bold text-foreground hover:text-accent">
                          {p.ticker}
                        </Link>
                      </td>
                      <td className="text-right px-3 py-2 text-muted">{p.shares}</td>
                      <td className="text-right px-3 py-2 text-muted">${p.avg_price.toFixed(2)}</td>
                      <td className="text-right px-3 py-2 text-foreground">
                        ${currentPrice.toFixed(2)}
                        {p.price && (
                          <span className={`ml-1 text-[9px] ${p.price.changePercent >= 0 ? "text-bullish" : "text-bearish"}`}>
                            {p.price.changePercent >= 0 ? "+" : ""}{p.price.changePercent.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="text-right px-3 py-2 text-foreground">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`text-right px-3 py-2 ${pnl >= 0 ? "text-bullish" : "text-bearish"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                      </td>
                      <td className={`text-center px-3 py-2 ${sentColor} uppercase text-[10px]`}>
                        {p.sentiment || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removePosition(p.ticker)}
                          className="text-[10px] text-bearish/50 hover:text-bearish transition-colors"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
