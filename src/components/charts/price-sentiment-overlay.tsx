"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SentimentPoint {
  date: string;
  avgSentiment: number;
}

interface ChartRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sentiment: number | null;
  barBase: number;
  barHeight: number;
}

interface PriceSentimentOverlayProps {
  tickers: string[];
}

export function PriceSentimentOverlay({ tickers }: PriceSentimentOverlayProps) {
  const [ticker, setTicker] = useState(tickers[0] || "AAPL");
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/charts/price-overlay?ticker=${ticker}&days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        const candles: Candle[] = d.candles || [];
        const sentiment: SentimentPoint[] = d.sentiment || [];
        const sentMap = new Map(sentiment.map((s) => [s.date, s.avgSentiment]));

        const merged: ChartRow[] = candles.map((c) => ({
          date: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          sentiment: sentMap.get(c.date) ?? null,
          barBase: Math.min(c.open, c.close),
          barHeight: Math.abs(c.close - c.open) || 0.01,
        }));

        setData(merged);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ticker, days]);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 p-4 border-b border-card-border flex-wrap">
        <select
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="bg-background border border-card-border text-xs text-foreground px-2 py-1.5 focus:outline-none focus:border-accent/50"
        >
          {tickers.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex gap-px">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[9px] px-2 py-1 border border-card-border tracking-wider ${
                days === d ? "bg-accent/20 text-accent border-accent/30" : "text-muted hover:text-foreground"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-[10px] text-muted tracking-widest">LOADING PRICE DATA...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-[10px] text-muted">No price data available for {ticker}</span>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1a1a1a" }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1a1a1a" }}
                  domain={["auto", "auto"]}
                />
                <YAxis
                  yAxisId="sentiment"
                  orientation="left"
                  tick={{ fontSize: 9, fill: "#888888" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1a1a1a" }}
                  domain={[-1, 1]}
                  hide
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111111",
                    border: "1px solid #1a1a1a",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  labelStyle={{ color: "#888888" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as ChartRow | undefined;
                    if (!row) return null;
                    return (
                      <div className="bg-[#111111] border border-[#1a1a1a] p-2 text-[10px] font-mono">
                        <div className="text-muted mb-1">{label}</div>
                        <div className="text-foreground">O: ${row.open} H: ${row.high}</div>
                        <div className="text-foreground">L: ${row.low} C: ${row.close}</div>
                        {row.sentiment !== null && (
                          <div className="text-purple-400">Sentiment: {row.sentiment.toFixed(2)}</div>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar
                  yAxisId="price"
                  dataKey="barHeight"
                  stackId="price"
                  barSize={6}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.close >= entry.open ? "#00ff88" : "#ff4444"}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
                <Area
                  yAxisId="sentiment"
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#7c3aed"
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
