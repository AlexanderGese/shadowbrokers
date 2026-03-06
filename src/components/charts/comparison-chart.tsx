"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#00aaff", "#00ff88", "#ff4444", "#ffaa00"];

interface DataPoint {
  date: string;
  [ticker: string]: string | number | null;
}

interface ComparisonChartProps {
  tickers: string[];
}

export function ComparisonChart({ tickers }: ComparisonChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (tickers.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all(
      tickers.map((t) =>
        fetch(`/api/charts/price-overlay?ticker=${t}&days=${days}`)
          .then((r) => r.json())
          .then((d) => ({ ticker: t, candles: d.candles || [] }))
          .catch(() => ({ ticker: t, candles: [] }))
      )
    ).then((results) => {
      // Build a date-indexed map of normalized prices (% change from day 1)
      const dateMap = new Map<string, DataPoint>();

      for (const { ticker, candles } of results) {
        if (candles.length === 0) continue;
        const basePrice = candles[0].close;
        if (!basePrice) continue;

        for (const c of candles) {
          const pctChange = ((c.close - basePrice) / basePrice) * 100;
          if (!dateMap.has(c.date)) {
            dateMap.set(c.date, { date: c.date });
          }
          dateMap.get(c.date)![ticker] = Math.round(pctChange * 100) / 100;
        }
      }

      const sorted = Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      setData(sorted);
      setLoading(false);
    });
  }, [tickers, days]);

  if (tickers.length === 0) return null;

  return (
    <div className="border-b border-card-border bg-card-bg">
      <div className="flex items-center justify-between p-4 border-b border-card-border">
        <span className="text-[10px] text-muted tracking-widest">
          NORMALIZED PRICE COMPARISON (% CHANGE)
        </span>
        <div className="flex gap-px">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[9px] px-2 py-1 border border-card-border tracking-wider ${
                days === d
                  ? "bg-accent/20 text-accent border-accent/30"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-[10px] text-muted tracking-widest">
              LOADING COMPARISON...
            </span>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-[10px] text-muted">
              No price data available
            </span>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
              >
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
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-[#111111] border border-[#1a1a1a] p-2 text-[10px] font-mono">
                        <div className="text-muted mb-1">{label}</div>
                        {payload.map((p) => (
                          <div key={p.dataKey} style={{ color: p.color }}>
                            {String(p.dataKey)}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}%
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }}
                />
                {tickers.map((t, i) => (
                  <Line
                    key={t}
                    type="monotone"
                    dataKey={t}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
