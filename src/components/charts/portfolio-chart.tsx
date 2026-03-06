"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface HistoryPoint {
  date: string;
  totalValue: number;
  totalCost: number;
}

export function PortfolioChart() {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio/history")
      .then((r) => r.json())
      .then((d) => setData(d.history || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="border border-card-border bg-card-bg p-4">
        <div className="h-48 flex items-center justify-center">
          <span className="text-[10px] text-muted tracking-widest">LOADING PORTFOLIO CHART...</span>
        </div>
      </div>
    );
  }

  if (data.length < 2) return null;

  const costBasis = data[0]?.totalCost ?? 0;

  return (
    <div className="border border-card-border bg-card-bg">
      <div className="px-4 pt-3 pb-1">
        <span className="text-[10px] text-muted tracking-widest">PORTFOLIO VALUE (30D)</span>
      </div>
      <div className="p-4 pt-1">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#888888" }}
                tickLine={false}
                axisLine={{ stroke: "#1a1a1a" }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#888888" }}
                tickLine={false}
                axisLine={{ stroke: "#1a1a1a" }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                domain={["auto", "auto"]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0]?.payload as HistoryPoint | undefined;
                  if (!pt) return null;
                  const pnl = pt.totalValue - pt.totalCost;
                  return (
                    <div className="bg-[#111111] border border-[#1a1a1a] p-2 text-[10px] font-mono">
                      <div className="text-muted mb-1">{label}</div>
                      <div className="text-foreground">Value: ${pt.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-muted">Cost: ${pt.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className={pnl >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}>
                        P&L: {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={costBasis}
                stroke="#888888"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="totalValue"
                stroke="#00ff88"
                strokeWidth={2}
                fill="url(#portfolioGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
