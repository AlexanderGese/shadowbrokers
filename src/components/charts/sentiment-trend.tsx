"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SentimentTrendPoint } from "@/lib/types";

interface SentimentTrendProps {
  ticker?: string;
  range?: string;
}

export function SentimentTrend({ ticker, range = "30d" }: SentimentTrendProps) {
  const [data, setData] = useState<SentimentTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ range });
    if (ticker) params.set("ticker", ticker);

    fetch(`/api/charts/sentiment?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker, range]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <span className="text-[10px] text-muted tracking-widest">LOADING CHART...</span>
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center">
        <span className="text-[10px] text-muted">Not enough data for chart</span>
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bullishGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bearishGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4444" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#ff4444" stopOpacity={0} />
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111111",
              border: "1px solid #1a1a1a",
              fontSize: 10,
              fontFamily: "monospace",
            }}
            labelStyle={{ color: "#888888" }}
          />
          <Area
            type="monotone"
            dataKey="bullish"
            stroke="#00ff88"
            fill="url(#bullishGrad)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="bearish"
            stroke="#ff4444"
            fill="url(#bearishGrad)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="neutral"
            stroke="#ffaa00"
            fill="none"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
